
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var spawn  = require('child_process').spawn;

var facedetectPath = '/home/migan/projects/facedetect/detectFaces';

exports.removeFile = function(filePath, callback)
{
  fs.exists(filePath, function(exists)
  {
    if (exists)
    {
      fs.unlink(filePath, function(error)
      {
        if (callback)
        {
          callback(error);
        }
      });

      return;
    }

    if (callback)
    {
      callback(null);
    }
  });
}

exports.md5File = function(filePath, callback)
{
  var checksum = crypto.createHash("md5");
  var stream = fs.ReadStream(filePath);

  stream.on('data', function(data)
  {
    checksum.update(data);
  });

  stream.on('error', function(error)
  {
    callback(error);
  });

  stream.on('end', function()
  {
    callback(null, checksum.digest('hex'));
  });
};


exports.runCommand = function(commandPath, args, options, callback)
{
  var error = "";
  var buffer = "";
  var resultCode = 0;
  var process = spawn(commandPath, args, options);

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
};

exports.timestamp = function(value)
{
  if (value)
  {
    return Math.floor(new Date(value).getTime() / 1000);
  }

  return Math.floor(new Date().getTime() / 1000);
};


exports.isDaylightSavings = function(datestring)
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
    var check = new Date(check);
    var start = new Date(ranges[n].start);
    var end = new Date(ranges[n].end);

    if (check <= end && check >= start)
    {
      return true;
    }
  }

  return false;
};


exports.parseCookieString = function(cookieString)
{
  var cookies = {};

  if (cookieString)
  {
    cookieString.split(';').forEach(function(cookie)
    {
      var parts = cookie.split('=');
      cookies[parts[0].trim()] = (parts[1] || '').trim();
    });
  }

  return cookies;
};

exports.inArray = function(needle, stack)
{
  for (var n = 0; n < stack.length; n++)
  {
    if (stack[n] === needle)
    {
      return true;
    }
  }

  return false;
};

exports.makeArray = function(hash)
{
  var result = [];

  for (var n in hash)
  {
    result.push(hash[n]);
  }

  return result;
};

exports.getTemplateFile = function(filename, callback)
{
  var dirname = path.dirname(filename) + "/";

  fs.readFile(filename, 'utf8', function(error, data)
  {
    if (error)
    {
      console.log("Could not read file " + filename);
      callback("Could not read file " + filename, null);
      return;
    }

    data = data.replace(/\{\{(.+?)\}\}/g, function(fullMatch, templateFilename)
    {
      if (templateFilename[0] === "#")
      {
        return "<!-- '" + templateFilename.substr(1) + "' not included -->";
      }

      templateFilename = dirname + templateFilename;

      try
      {
        return fs.readFileSync(templateFilename, 'utf8');
      }
      catch (e)
      {
        return "<!-- " + e + " -->";
      }
    });

    callback(null, data);
  });
};

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

