
var fs = require("fs");
var util = require("util");
var path = require("path");
var crypto = require("crypto");
var spawn  = require("child_process").spawn;
var events = require("events");
var moment = require("moment");
var MurrixChain = require("./chain.js").MurrixChain;

function MurrixUtilsManager(murrix)
{
  events.EventEmitter.call(this);

  var self = this;

  self.name = "utils";
  self.exiftoolPath = "exiftool";


  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  self.rawImageMimeTypes = [ "image/x-canon-cr2", "image/x-raw", "image/x-canon-crw", "image/x-nikon-nef", "image/CR2" ];
  self.imageMimeTypes = [ "image/jpeg", "image/gif", "image/tiff", "image/png", "image/bmp" ].concat(self.rawImageMimeTypes);
  self.videoMimeTypes = [ "video/mpeg", "video/avi", "video/quicktime", "video/x-ms-wmv", "video/mp4", "video/3gpp", "video/x-msvideo" ];
  self.audioMimeTypes = [ "audio/mpeg", "audio/x-wav", "audio/x-m4a", "audio/mp4" ];

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////





  murrix.on("init", function()
  {
    self.emit("done");
  });

  self.eventMerge = function(obj, events, doneEvent)
  {
    doneEvent = doneEvent || "done";
    var count = 0;

    var eventHandler = function()
    {
      count++;

      if (count === events.length)
      {
        count = 0;
        obj.emit(doneEvent);
      }
    };

    for (var n = 0; n < events.length; n++)
    {
      obj.on(events[n], eventHandler);
    }
  };


  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  self.mimeIsImage = function(mimeType)
  {
    return self.inArray(mimeType, self.imageMimeTypes);
  };

  self.mimeIsRawImage = function(mimeType)
  {
    return self.inArray(mimeType, self.rawImageMimeTypes);
  };

  self.mimeIsVideo = function(mimeType)
  {
    return self.inArray(mimeType, self.videoMimeTypes);
  };

  self.mimeIsAudio = function(mimeType)
  {
    return self.inArray(mimeType, self.audioMimeTypes);
  };

  self.run = function(command, args, options, callback)
  {
    var error = "";
    var buffer = "";
    var resultCode = 0;

    try
    {
      var process = spawn(command, args, options);

      process.stdout.setEncoding("ascii");
      process.stderr.setEncoding("ascii");

      process.stdout.on("data", function(data)
      {
        buffer += data;
      });

      process.stderr.on("data", function(data)
      {
        error += data;
      });

      process.on("exit", function(code)
      {
        resultCode = code;
      });

      process.on("close", function()
      {
        if (resultCode !== 0)
        {
          callback("Exited with code: " + resultCode + "\n" + error);
          return;
        }

        callback(null, buffer);
      });
    }
    catch (e)
    {
      callback(e);
    }
  };

  self.createDirectory = function(path, callback)
  {
    fs.exists(path, function(exists)
    {
      if (exists)
      {
        callback(null);
        return;
      }

      fs.mkdir(path, 0770, function(error)
      {
        if (error)
        {
          callback(error);
          return;
        }

        murrix.logger.info(self.name, "Created directory at " + path);
        callback(null);
      });
    });
  };

  self.copyFile = function(source, destination, callback)
  {
    var is = fs.createReadStream(source);
    var os = fs.createWriteStream(destination);

    murrix.logger.debug(self.name, "Will copy " + source + " to " + destination + "...");

    util.pump(is, os, function(error)
    {
      if (error)
      {
        callback("Failed to copy file, reason: " + error);
        return;
      }

      callback();
    });
  };

  self.removeFile = function(filename, callback)
  {
    fs.exists(filename, function(exists)
    {
      if (!exists)
      {
        if (callback)
        {
          callback(null, exists);
        }

        return;
      }

      fs.unlink(filename, function(error)
      {
        if (callback)
        {
          callback(error, exists);
        }
      });
    });
  };

  self.removeFiles = function(filenames, callback)
  {
    var chain = new MurrixChain();
    var removeHandler = function(filename, options, chainCallback)
    {
      self.removeFile(filename,  function(error, existed)
      {
        if (error)
        {
          chainCallback(error);
          return;
        }

        if (existed)
        {
          murrix.logger.debug(self.name, "Removed " + filename + "!");
        }
        else
        {
          murrix.logger.debug(self.name, filename + " never existed!");
        }

        chainCallback();
      });
    };

    for (var i = 0; i < filenames.length; i++)
    {
      chain.add(filenames[i], removeHandler);
    }

    chain.final(function(error)
    {
      if (error)
      {
        murrix.logger.error(self.name, error);
        callback(error);
      }

      callback();
    });

    chain.run();
  };

  self.removeDirectory = function(path, callback)
  {
    // TODO: Make this async

    if (fs.existsSync(path))
    {
      fs.readdirSync(path).forEach(function(file)
      {
        var currentPath = path + "/" + file;

        if (fs.statSync(currentPath).isDirectory())
        {
          self.removeDirectory(currentPath);
        }
        else
        {
          fs.unlinkSync(currentPath);
        }
      });

      fs.rmdirSync(path);
    }

    if (callback)
    {
      callback();
    }
  };

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////




  self.clone = function(obj)
  {
    return util._extend({}, obj);
  };





  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  self.inArray = function(needle, haystack)
  {
    for (var n = 0; n < haystack.length; n++)
    {
      if (haystack[n] === needle)
      {
        return true;
      }
    }

    return false;
  };

  self.makeArray = function(hash)
  {
    var array = [];

    for (var key in hash)
    {
      array.push(hash[key]);
    }

    return array;
  };

  self.addToArray = function(needle, haystack)
  {
    var needles = needle;

    if (!(needle instanceof Array))
    {
      needles = [ needle ];
    }

    for (var n = 0; n < needles.length; n++)
    {
      if (!self.inArray(needles[n], haystack))
      {
        haystack.push(needles[n]);
      }
    }

    return haystack;
  };

  self.intersectArrays = function(a, b)
  {
    return a.filter(function(element)
    {
      return self.inArray(element, b);
    });
  };


  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////







  self.rpad = function(str, char, len)
  {
    while (str.length < len)
    {
      str += char;
    }

    return str;
  };

  self.lpad = function(str, char, len)
  {
    while (str.length < len)
    {
      str = char + str;
    }

    return str;
  };

  self.isDaylightSavings = function(datestring)
  {
    var parts = datestring.split(" ");
    var check = parts[0];

    parts = check.split("-");

    if (parts[0] === "XXXX" || parts[1] === "XX" || parts[2] === "XX")
    {
      return false;
    }

    var ranges = [];

    ranges.push({ start: "1980-04-06", end: "1980-09-28" });
    ranges.push({ start: "1981-03-29", end: "1981-09-27" });
    ranges.push({ start: "1982-03-28", end: "1982-09-26" });
    ranges.push({ start: "1983-03-27", end: "1983-09-25" });
    ranges.push({ start: "1984-03-25", end: "1984-09-30" });
    ranges.push({ start: "1985-03-31", end: "1985-09-29" });
    ranges.push({ start: "1986-03-30", end: "1986-09-28" });
    ranges.push({ start: "1987-03-29", end: "1987-09-27" });
    ranges.push({ start: "1988-03-27", end: "1988-09-25" });
    ranges.push({ start: "1989-03-26", end: "1989-09-24" });
    ranges.push({ start: "1990-03-25", end: "1990-09-30" });
    ranges.push({ start: "1991-03-31", end: "1991-09-29" });
    ranges.push({ start: "1992-03-29", end: "1992-09-27" });
    ranges.push({ start: "1993-03-28", end: "1993-09-26" });
    ranges.push({ start: "1994-03-27", end: "1994-09-25" });
    ranges.push({ start: "1995-03-26", end: "1995-09-24" });
    ranges.push({ start: "1996-03-31", end: "1996-10-27" });
    ranges.push({ start: "1997-03-30", end: "1997-10-26" });
    ranges.push({ start: "1998-03-29", end: "1998-10-25" });
    ranges.push({ start: "1999-03-28", end: "1999-10-31" });
    ranges.push({ start: "2000-03-26", end: "2000-10-29" });
    ranges.push({ start: "2001-03-25", end: "2001-10-28" });
    ranges.push({ start: "2002-03-31", end: "2002-10-27" });
    ranges.push({ start: "2003-03-30", end: "2003-10-26" });
    ranges.push({ start: "2004-03-28", end: "2004-10-31" });
    ranges.push({ start: "2005-03-27", end: "2005-10-30" });
    ranges.push({ start: "2006-03-26", end: "2006-10-29" });
    ranges.push({ start: "2007-03-25", end: "2007-10-28" });
    ranges.push({ start: "2008-03-30", end: "2008-10-26" });
    ranges.push({ start: "2009-03-29", end: "2009-10-25" });
    ranges.push({ start: "2010-03-28", end: "2010-10-31" });
    ranges.push({ start: "2011-03-27", end: "2011-10-30" });
    ranges.push({ start: "2012-03-25", end: "2012-10-28" });
    ranges.push({ start: "2013-03-31", end: "2013-10-27" });
    ranges.push({ start: "2014-03-30", end: "2014-10-26" });
    ranges.push({ start: "2015-03-29", end: "2015-10-25" });
    ranges.push({ start: "2016-03-27", end: "2016-10-30" });
    ranges.push({ start: "2017-03-26", end: "2017-10-29" });
    ranges.push({ start: "2018-03-25", end: "2018-10-28" });
    ranges.push({ start: "2019-03-31", end: "2019-10-27" });
    ranges.push({ start: "2020-03-29", end: "2020-10-25" });

    for (var n = 0; n < ranges.length; n++)
    {
      check = new Date(check);
      var start = new Date(ranges[n].start);
      var end = new Date(ranges[n].end);

      if (check <= end && check >= start)
      {
        return true;
      }
    }

    return false;
  };

  self.timestamp = function(value)
  {
    if (value)
    {
      return Math.floor(new Date(value).getTime() / 1000);
    }

    return Math.floor(new Date().getTime() / 1000);
  };

  self.parseTimezone = function(string)
  {
    if (!string || string === false || string === "Unknown")
    {
      return "+00:00";
    }

    var timezone = string.match(/\(GMT(.*?)\)/)[1];

    if (timezone === "")
    {
      return "+00:00";
    }

    return timezone;
  };

  self.cleanDatestring = function(datestring)
  {
    if (datestring[datestring.length - 1] === "Z")
    {
      datestring = datestring.substr(0, datestring.length - 1); // Remove trailing Z
    }

    // Replace dividing : with -
    var parts = datestring.split(" ");
    datestring = parts[0].replace(/:/g, "-") + " " + parts[1];

    return datestring;
  };





  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  self.md5File = function(filename, callback)
  {
    var checksum = crypto.createHash("md5");
    var stream = fs.ReadStream(filename);

    stream.on("data", function(data)
    {
      checksum.update(data);
    });

    stream.on("error", function(error)
    {
      callback(error);
    });

    stream.on("end", function()
    {
      callback(null, checksum.digest("hex"));
    });
  };

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



  self.intval = function(value)
  {
    var intvalue = value;

    if (typeof value !== "number")
    {
      try
      {
        intvalue = parseInt(value, 10);
      }
      catch (e)
      {
      }
    }

    if (typeof intvalue !== "number" || isNaN(intvalue))
    {
      murrix.logger.error(self.name, "Could not convert value to int: \"" + value + "\" (" + (typeof value) + ") -> \"" + intvalue + "\" (" + typeof intvalue + ")");
      intvalue = 0;
    }

    return intvalue;
  };

  self.compileTemplateFile = function(filename, callback)
  {
    var dirname = path.dirname(filename) + "/";
    var resultFilename = filename.replace(/.tmpl/g, "");

    fs.readFile(filename, "utf8", function(error, data)
    {
      if (error)
      {
        callback(error);
        return;
      }

      data = data.replace(/\{\{include:(.+?)\}\}/g, function(fullMatch, templateFilename)
      {
        if (templateFilename[0] === "#")
        {
          return "<!-- '" + templateFilename.substr(1) + "' not included -->";
        }

        templateFilename = dirname + templateFilename;

        try
        {
          return fs.readFileSync(templateFilename, "utf8");
        }
        catch (e)
        {
          murrix.logger.error(self.name, "Could not read file, reason: " + e);
          return "<!-- " + e + " -->";
        }
      });

      data = data.replace(/\{\{link:(.+?)\}\}/g, function(fullMatch, linkFilename)
      {
        if (linkFilename[0] === "#")
        {
          return "";
        }

        var filename = dirname + linkFilename;

        try
        {
          var stat = fs.statSync(filename);

          linkFilename += "?v=" + ((new Date(stat.mtime)).getTime() / 1000);

          return linkFilename;
        }
        catch (e)
        {
          murrix.logger.error(self.name, "Could not stat file, reason: " + e);
          return "";
        }
      });

      fs.writeFile(resultFilename, data, function(error)
      {
        if (error)
        {
          callback(error);
          return;
        }

        murrix.logger.info(self.name, "Compiled template " + path.basename(filename) + " successfully!");
        callback(null, data);
      });
    });
  };

  self.sortCameraReferenceTimeline = function(timelines)
  {
    timelines.sort(function(a, b)
    {
      /* Less than 0: Sort "a" to be a lower index than "b"
        * Zero: "a" and "b" should be considered equal, and no sorting performed.
        * Greater than 0: Sort "b" to be a lower index than "a".
        *
        * type === 'utc' should be at top, type === 'timezone' at the bottom
        * if type is the same preserve order to not mess things up, new we pushed to the end should not become the default unless it is the only one!
        */

      if (a.type === b.type)
      {
        return 0;
      }
      else if (a.type === "utc" && b.type === "timezone")
      {
        return -1;
      }
      else if (a.type === "timezone" && b.type === "utc")
      {
        return 1;
      }

      murrix.logger.debug(self.name, "Found unknown type combination in sort of reference timelines", a, b);
      return 0;
    });

    return timelines;
  };

  self.getWhenTimestamp = function(itemSource, cameraSettings)
  {
    var timestamp = false;

    if (itemSource === false)
    {
      return false;
    }

    if (itemSource.type === "gps")
    {
      return self.timestamp(itemSource.datestring + " +00:00");
    }
    else if (itemSource.type === "manual")
    {
      var timezone = self.parseTimezone(itemSource.timezone);
      var datestring = itemSource.datestring;
      var parts = datestring.replace(/-/g, " ").replace(/:/g, " ").split(" ");

      if (parts[0] === "XXXX") // No Year
      {
        return false;
      }
      else if (parts[1] === "XX") // No Month
      {
        datestring = parts[0] + "-01-01 00:00:00 " + timezone;
      }
      else if (parts[2] === "XX") // No Day
      {
        datestring = parts[0] + "-" + parts[1] + "-01 00:00:00 " + timezone;
      }
      else if (parts[3] === "XX") // No Hour
      {
        datestring = parts[0] + "-" + parts[1] + "-" + parts[2] + " 00:00:00 " + timezone;
      }
      else if (parts[4] === "XX") // No Minute
      {
        datestring = parts[0] + "-" + parts[1] + "-" + parts[2] + " " + parts[3] + ":00:00 " + timezone;
      }
      else if (parts[5] === "XX") // No second
      {
        datestring = parts[0] + "-" + parts[1] + "-" + parts[2] + " " + parts[3] + ":" + parts[4] + ":00 " + timezone;
      }
      else // Full date and time
      {
        datestring = parts[0] + "-" + parts[1] + "-" + parts[2] + " " + parts[3] + ":" + parts[4] + ":" + parts[5] + " " + timezone;
      }

      timestamp = self.timestamp(datestring);

      if (itemSource.daylightSavings) // TODO: Verify this in some way
      {
        timestamp -= 3600;
      }

      return timestamp;
    }
    else if (itemSource.type === "camera")
    {
      if (itemSource.reference === "None" || !cameraSettings.referenceTimelines || cameraSettings.referenceTimelines.length === 0)
      {
        timestamp = self.timestamp(itemSource.datestring + " " + self.parseTimezone(itemSource.timezone));

        // If camera automatically changes it time for daylight savings, we need to compensate for it here
        if (cameraSettings.mode === "autoDaylightSavings" || cameraSettings.mode === "autoDatetime")
        {
          if (self.isDaylightSavings(itemSource.datestring))
          {
            timestamp -= 3600;
          }
        }

        return timestamp;
      }

      timestamp = self.timestamp(itemSource.datestring + " +00:00");
      var index = false;

      if (itemSource.reference === false) // Use default reference
      {
        index = 0;
      }
      else
      {
        for (var n = 0; n < cameraSettings.referenceTimelines.length; n++)
        {
          if (cameraSettings.referenceTimelines[n]._id === itemSource.reference)
          {
            index = n;
            break;
          }
        }
      }

      if (index === false)
      {
        murric.logger.debug(self.name, "Could not find the specified reference");

        timestamp = self.timestamp(itemSource.datestring + " " + self.parseTimezone(itemSource.timezone));

        // If camera automatically changes it time for daylight savings, we need to compensate for it here
        if (cameraSettings.mode === "autoDaylightSavings" || cameraSettings.mode === "autoDatetime")
        {
          if (self.isDaylightSavings(itemSource.datestring))
          {
            timestamp -= 3600;
          }
        }

        return timestamp;
      }

      if (cameraSettings.referenceTimelines[index].type === "timezone")
      {
        timestamp = self.timestamp(itemSource.datestring + " " + self.parseTimezone(cameraSettings.referenceTimelines[index].name));

        // If camera automatically changes it time for daylight savings, we need to compensate for it here
        if (cameraSettings.mode === "autoDaylightSavings" || cameraSettings.mode === "autoDatetime")
        {
          if (self.isDaylightSavings(itemSource.datestring))
          {
            timestamp -= 3600;
          }
        }
      }
      else
      {
        timestamp += cameraSettings.referenceTimelines[index].offset;
      }

      return timestamp;
    }
    else if (itemSource.type === false)
    {
      return false;
    }
    else
    {
      murrix.logger.error(self.name, "Unknown source type, " + itemSource.type);
      murrix.logger.error(self.name, itemSource);
    }

    return false;
  };

  self.readExif = function(filename, callback)
  {
    fs.exists(filename, function(exists)
    {
      if (!exists)
      {
        callback(filename + " does not exist!");
        return;
      }

      var args = [ "-j", "-n" ];

      args.push("-x");
      args.push("DataDump");

      args.push("-x");
      args.push("ThumbnailImage");

      args.push("-x");
      args.push("Directory");

      args.push("-x");
      args.push("FilePermissions");

      args.push("-x");
      args.push("TextJunk");

      args.push("-x");
      args.push("ColorBalanceUnknown");

      args.push("-x");
      args.push("Warning");

      args.push(filename);

      self.run(self.exiftoolPath, args, {}, function(error, output)
      {
        if (error)
        {
          murrix.logger.error(self.name, "Could not get EXIF data from file, reason: " + error);
          callback("Could not get EXIF data from file, reason: " + error);
          return;
        }

        try
        {
          var exif = JSON.parse(output)[0];

          if (exif.DateTimeOriginal === "    :  :     :  :  ")
          {
            delete exif.DateTimeOriginal;
          }

          callback(null, exif);
        }
        catch (e)
        {
          murrix.logger.error(self.name, "Could not parse exif output from " + filename);
          murrix.logger.debug(self.name, output);
          callback(e.toString());
        }
      });
    });
  };

  self.readMimeType = function(filename, callback)
  {
    fs.exists(filename, function(exists)
    {
      if (!exists)
      {
        callback(filename + " does not exist!");
        return;
      }

      var args = [ "-j", "-n", "-MIMEType" ];

      args.push(filename);

      self.run(self.exiftoolPath, args, {}, function(error, output)
      {
        if (error)
        {
          murrix.logger.error(self.name, "Could not get EXIF data from file, reason: " + error);
          callback("Could not get EXIF data from file, reason: " + error);
          return;
        }

        try
        {
          var exif = JSON.parse(output)[0];

          callback(null, exif.MIMEType);
        }
        catch (e)
        {
          murrix.logger.error(self.name, "Could not parse exif output from " + filename);
          murrix.logger.debug(self.name, output);
          callback(e.toString());
        }
      });
    });
  };

  self.createArchive = function(filename, list, callback)
  {
    var path = murrix.config.getPathTemp() + murrix.utils.timestamp();

    self.createDirectory(path, function(error)
    {
      if (error)
      {
        callback(error);
        return;
      }

      var chain = new MurrixChain();

      for (var n = 0; n < list.length; n++)
      {
        chain.add(list[n], function(item, options, chainCallback)
        {
          var targetFilename = path + "/" + item.name;

          fs.symlink(item.path, targetFilename, function(error)
          {
            if (error)
            {
              chainCallback("Failed to symlink " + item.path + " to " + targetFilename + ", reason: " + error);
              return;
            }

            chainCallback();
          });
        });
      }

      chain.final(function(error)
      {
        if (error)
        {
          callback(error);
          return;
        }

        var args = [ "-r", filename, "." ];

        self.run("zip", args, { cwd: path }, function(error, output)
        {
          self.removeDirectory(path);

          if (error)
          {
            callback("Could not get create archive, reason: " + error);
            return;
          }

          fs.exists(filename, function(exists)
          {
            if (!exists)
            {
              callback("Could not get create archive file does not exist!");
              return;
            }

            callback();
          });
        });
      });

      chain.run();
    });
  };

  self.nmeaDDMMSSToDecimalDegrees = function(dms)
  {
    var ddmmss = (parseFloat(dms) / 100);
    var degrees = Math.floor(ddmmss);
    var minutesseconds = ((ddmmss - degrees) * 100) / 60.0;

    return degrees + minutesseconds;
  };

  self.parseNmea = function(sentence)
  {
    var position = {};
    //gprmc: '$GPRMC,204955.379,A,5740.24506,N,1156.23063,E,0.000000,0.000000,200713,,*32' },
    //gprmc: '$GPRMC,204957.469,A,5740.24506,N,1156.23058,E,0.000000,0.000000,200713,,*3E' },

    var parts = sentence.split(",");

    if (parts[0] === "$GPRMC")
    {
      position.datestring = "20" + parts[9].substr(4, 2); // Year
      position.datestring += "-";
      position.datestring += parts[9].substr(2, 2); // Month
      position.datestring += "-";
      position.datestring += parts[9].substr(0, 2); // Day
      position.datestring += " ";
      position.datestring += parts[1].substr(0, 2); // Hour
      position.datestring += ":";
      position.datestring += parts[1].substr(2, 2); // Minute
      position.datestring += ":";
      position.datestring += parts[1].substr(4, 2); // Second

      position.valid = parts[2] === "A";

      position.latitude = self.nmeaDDMMSSToDecimalDegrees(parts[3]);

      if (parts[4] == "S")
      {
        position.latitude = -position.latitude;
      }

      position.longitude = self.nmeaDDMMSSToDecimalDegrees(parts[5]);

      if (parts[6] == "W")
      {
        position.longitude = -position.longitude;
      }

      position.speed = parseFloat(parts[7]) * 1.852;
      position.bearing = parseFloat(parts[8]);

      return position;
    }

    return false;
  };

  self.sortItemFunction = function(a, b)
  {
    if ((!b.when || b.when.timestamp === false) && (!a.when || a.when.timestamp === false))
    {
      if (!b.name || !a.name)
      {
        return 0;
      }

      return -self.natcasecmp(b.name, a.name);
    }
    else if ((b.when && b.when.timestamp !== false) && (!a.when || a.when.timestamp === false))
    {
      return -1;
    }
    else if ((a.when && a.when.timestamp !== false) && (!b.when || b.when.timestamp === false))
    {
      return 1;
    }
    else if ((!b.when || b.when.timestamp === false) || (!a.when || a.when.timestamp === false))
    {
      return 0;
    }

    var offset = 0;

    if (a.when.timestamp < 0 || b.when.timestamp < 0)
    {
      offset = Math.abs(Math.min(a.when.timestamp, b.when.timestamp));
    }

    return (a.when.timestamp + offset) - (b.when.timestamp + offset);
  };



  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Taken from http://my.opera.com/GreyWyvern/blog/show.dml/1671288
  self.natcasecmp = function(a, b)
  {
    function chunkify(t) {
      var tz = [], x = 0, y = -1, n = 0, i, j;

      while ((i = (j = t.charAt(x++)).charCodeAt(0))) {
        var m = (i == 46 || (i >=48 && i <= 57));
        if (m !== n) {
          tz[++y] = "";
          n = m;
        }
        tz[y] += j;
      }
      return tz;
    }

    var aa = chunkify(a);
    var bb = chunkify(b);

    for (x = 0; aa[x] && bb[x]; x++) {
      if (aa[x] !== bb[x]) {
        var c = Number(aa[x]), d = Number(bb[x]);
        if (c == aa[x] && d == bb[x]) {
          return c - d;
        } else return (aa[x] > bb[x]) ? 1 : -1;
      }
    }
    return aa.length - bb.length;
  };

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////







  self.calculateAge = function(birthTimestamp, nowTimestamp)
  {
    var today = new Date();
    var birthDate = new Date();

    birthDate.setTime(birthTimestamp * 1000);

    if (nowTimestamp)
    {
      today.setTime(nowTimestamp * 1000);
    }

    var age = today.getFullYear() - birthDate.getFullYear();
    var m = today.getMonth() - birthDate.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate()))
    {
      age--;
    }

    return age;
  };
}

util.inherits(MurrixUtilsManager, events.EventEmitter);

exports.Manager = MurrixUtilsManager;

/*
var facedetectPath = '/home/migan/projects/facedetect/detectFaces';

exports.detectFaces = function(filename, callback)
{
  fs.exists(filename, function(exists)
  {
    if (!exists)
    {
      callback(filename + " does not exist!");
      return;
    }

    var error = "";
    var buffer = "";
    var process = spawn(facedetectPath, [ filename ]);

    process.stdout.setEncoding("ascii");
    process.stderr.setEncoding("ascii");

    process.stdout.on("data", function(data)
    {
      buffer += data;
    });

    process.stderr.on("data", function(data)
    {
      error += data;
    });

    process.on("exit", function(code)
    {
      if (error || code !== 0)
      {
        if (error.length === 0)
        {
          error = "Exiftool exited with code: " + code;
        }

        callback(error);
        return;
      }
      console.log("BUFFER", buffer);

      callback(null, JSON.parse(buffer));
    });

  });
};
*/
