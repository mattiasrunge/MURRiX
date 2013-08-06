
var fs = require("fs");
var path = require("path");
var util = require("util");
var stewardess = require("stewardess");
var generateWaveform = require("waveform");
var events = require("events");
var MurrixQueue = require("./queue.js").MurrixQueue;

function MurrixCacheManager(murrix)
{
  events.EventEmitter.call(this);

  var self = this;

  self.name = "cache";
  self.runningJobs = [];
  self.queue = new MurrixQueue(murrix, "cache", [ "type" ]);

  self.ffmpegPath = "ffmpeg";
  self.convertPath = "convert";
  self.mpg123Path = "mpg123";
  self.timer = null;

  murrix.client.on("done", function()
  {
    murrix.client.register("getCacheStatus", function(session, args, callback)
    {
      self.getStatus(args, callback);
    });

    self.emit("done");
  });

  murrix.on("done", function()
  {
    murrix.server.on("serverStarted", function()
    {
      self._syncAndRunQueue(function()
      {
        if (!self.timer)
        {
          self.timer = setInterval(function()
          {
            self._syncAndRunQueue();
          }, 60 * 1000);
        }
      });
    });
  });

  self._syncAndRunQueue = function(callback)
  {
    self.queue.sync(function(error)
    {
      if (error)
      {
        murrix.logger.error(self.name, "Could not synchronize queue from database, reason: " + error);
      }
      else
      {
        murrix.logger.debug(self.name, "Successfully synchronized queue from database!");
      }

      self._runQueue();

      if (callback)
      {
        callback();
      }
    });
  };

  self._chainCreateImage = function(options, next)
  {
    var tempfile = murrix.config.getPathTemp() + "murrix_cache_create_image_" + options.id + "_" + (new Date().getTime()) + ".jpg";

    var args = [];
    var ratio = 0;

    if (options.isCr2)
    {
      options.sourceFilename = "cr2:" + options.sourceFilename;
    }

    args.push(options.sourceFilename);

    if (options.angle)
    {
      args.push("-rotate");
      args.push(-options.angle);
      args.push("+repage");
    }

    if (options.mirror)
    {
      args.push("-flop");
      args.push("+repage");
    }


    // Square (the biggest of width or height will be used
    if (options.square)
    {
      var size = Math.max(options.width, options.height);

      args.push("-resize");
      args.push(size + "x" + size + "^");
      args.push("+repage");
      args.push("-gravity");
      args.push("center");
      args.push("-crop");
      args.push(size + "x" + size + "+0+0");
    }

    // Width and height specified, crop and resize image to those
    else if (options.width > 0 && options.height > 0)
    {
      if (options.width > options.height && options.sourceWidth > options.sourceHeight)
      {
        args.push("-resize");
        args.push(options.width + "x" + options.height);
        args.push("+repage");
      }
      else
      {
        args.push("-resize");
        args.push(options.width + "x" + options.height + "^");
        args.push("+repage");
        args.push("-gravity");
        args.push("center");
        args.push("-crop");
        args.push(options.width + "x" + options.height + "+0+0");
      }
    }

    // Width specified, use width and calculate height to keep aspect ratio
    else if (options.width > 0)
    {
      ratio = options.sourceHeight / options.sourceWidth;
      var height = options.width * ratio;

      args.push("-resize");
      args.push(options.width + "x" + height);
      args.push("+repage");
    }

    // Height specified, use height and calculate width to keep aspect ratio
    else if (options.height > 0)
    {
      ratio = options.sourceWidth / options.sourceHeight;
      var width = options.height * ratio;

      args.push("-resize");
      args.push(width + "x" + options.height);
      args.push("+repage");
    }

    args.push("-strip");
    args.push("-format");
    args.push("jpg");
    args.push("-quality");
    args.push("91");
    args.push(tempfile);

    options.temporaryFilenames.push(tempfile);

    murrix.utils.run(self.convertPath, args, { cwd: murrix.config.getPathTemp() }, function(error)
    {
      if (error)
      {
        murrix.logger.error(self.name, "Failed to convert image, reason: " + error);
        next("break");
        return;
      }

      murrix.logger.info(self.name, "Converted image successfully and saved it to " + tempfile + "!");

      options.sourceFilename = tempfile;
      next();
    });
  };

  self._chainCreateFfmpegImage = function(options, next)
  {
    var tempfile = murrix.config.getPathTemp() + "murrix_cache_create_ffmpeg_image_" + options.id + "_" + (new Date().getTime()) + ".jpg";

    var args = [];

    args.push("-i");
    args.push(options.sourceFilename);

    if (options.deinterlace)
    {
      args.push("-filter:v");
      args.push("yadif");
    }

    args.push("-ss");

    if (options.videoPosition)
    {
      args.push(options.videoPosition);
    }
    else
    {
      args.push("00:00:00");
    }

    args.push("-t");
    args.push("00:00:01");
    args.push("-r");
    args.push("1");
    args.push("-y");
    args.push("-an");
    args.push("-qscale");
    args.push("0");
    args.push("-f");
    args.push("mjpeg");
    args.push(tempfile);

    options.temporaryFilenames.push(tempfile);

    murrix.utils.run(self.ffmpegPath, args, { cwd: murrix.config.getPathTemp() }, function(error)
    {
      if (error)
      {
        murrix.logger.error(self.name, "Failed to get video frame, reason: " + error);
        next("break");
        return;
      }

      murrix.logger.info(self.name, "Got video frame successfully and saved it to " + tempfile + "!");

      options.sourceFilename = tempfile;
      next();
    });
  };

  self._chainCreateWavAudio = function(options, next)
  {
    var tempfile = murrix.config.getPathTemp() + "murrix_cache_create_mpg123_audio_" + options.id + "_" + (new Date().getTime()) + ".wav";

    var args = [];

    args.push("-w");
    args.push(tempfile);
    args.push(options.sourceFilename);

    options.temporaryFilenames.push(tempfile);

    murrix.utils.run(self.mpg123Path, args, { cwd: murrix.config.getPathTemp() }, function(error)
    {
      if (error)
      {
        murrix.logger.error(self.name, "Failed to convert to wav, reason: " + error);
        next("break");
        return;
      }

      murrix.logger.info(self.name, "Converted to wave successfully and saved it to " + tempfile + "!");

      options.sourceFilename = tempfile;
      next();
    });
  };

  self._chainCreateWaveformImage = function(options, next)
  {
    var tempfile = murrix.config.getPathTemp() + "murrix_cache_create_waveform_image_" + options.id + "_" + (new Date().getTime()) + ".png";

    var args = {};

    if (options.square)
    {
      args.width = Math.max(options.width, options.height);
      args.height = Math.max(options.width, options.height);
    }
    else
    {
      args.width = options.width;
      args.height = options.height;
    }

    args['color-bg'] = "000000ff";
    args['color-center'] = "ffffffff";
    args['color-outer'] = "0088ccff";

    options.temporaryFilenames.push(tempfile);

    generateWaveform(options.sourceFilename, tempfile, args, function(error)
    {
      if (error)
      {
        murrix.logger.error(self.name, "Failed to create waveform image, reason: " + error);
        next("break");
        return;
      }

      murrix.logger.info(self.name, "Created waveform image successfully and saved it to " + tempfile + "!");

      options.sourceFilename = tempfile;
      next();
    });
  };

  self._chainCreateFfmpegVideo = function(options, next)
  {
    var tempfile1 = murrix.config.getPathTemp() + "murrix_cache_create_ffmpeg_video1_" + options.id + "_" + (new Date().getTime()) + ".webm";
    var tempfile2 = murrix.config.getPathTemp() + "murrix_cache_create_ffmpeg_video2_" + options.id + "_" + (new Date().getTime()) + ".webm";

    var args = [];

    args.push("-i");
    args.push(options.sourceFilename);

    if (options.deinterlace)
    {
      args.push("-filter:v");
      args.push("yadif");
    }

    if (options.angle === 90)
    {
      args.push("-vf");
      args.push("transpose=2");
    }
    else if (options.angle === 270)
    {
      args.push("-vf");
      args.push("transpose=1");
    }
    else if (options.angle === 180)
    {
      args.push("-vf");
      args.push("transpose=1,transpose=1");
    }

    args.push("-codec:v");
    args.push("libvpx");

    args.push("-quality");
    args.push("good");

    args.push("-cpu-used");
    args.push("0");

    args.push("-b:v");
    args.push("500k");

    args.push("-qmin");
    args.push("10");

    args.push("-qmax");
    args.push("42");

    args.push("-maxrate");
    args.push("500k");

    args.push("-bufsize");
    args.push("1000k");

    args.push("-threads");
    args.push(murrix.config.cacheSlots);

    var argsPass1 = [];
    argsPass1.push("-an");

    argsPass1.push("-pass");
    argsPass1.push("1");

    argsPass1.push("-f");
    argsPass1.push("webm");

    argsPass1.push(tempfile1);

    options.temporaryFilenames.push(tempfile1);
    options.temporaryFilenames.push(murrix.config.getPathTemp() + "ffmpeg2pass-0.log");
    options.temporaryFilenames.push(murrix.config.getPathTemp() + "av2pass-0.log");

    murrix.utils.run(self.ffmpegPath, args.concat(argsPass1), { cwd: murrix.config.getPathTemp() }, function(error)
    {
      if (error)
      {
        murrix.logger.error(self.name, "Failed to convert video on first pass, reason: " + error);
        next("break");
        return;
      }

      murrix.logger.info(self.name, "First video convertion pass was successfull and saved to " + tempfile1 + "!");

      var argsPass2 = [];
      argsPass2.push("-codec:a");
      argsPass2.push("libvorbis");

      argsPass2.push("-b:a");
      argsPass2.push("128k");

      argsPass2.push("-ar");
      argsPass2.push("44100");

      argsPass2.push("-pass");
      argsPass2.push("2");

      argsPass2.push("-f");
      argsPass2.push("webm");

      argsPass2.push(tempfile2);

      options.temporaryFilenames.push(tempfile2);

      murrix.utils.run(self.ffmpegPath, args.concat(argsPass2), { cwd: murrix.config.getPathTemp() }, function(error)
      {
        if (error)
        {
          murrix.logger.error(self.name, "Failed to convert video on second pass, reason: " + error);
          next("break");
          return;
        }

        murrix.logger.info(self.name, "Converted video successfully and saved it to " + tempfile2 + "!");

        options.sourceFilename = tempfile2;
        next();
      });
    });
  };

  self._chainCreateFfmpegAudio = function(options, next)
  {
    var tempfile = murrix.config.getPathTemp() + "murrix_cache_create_ffmpeg_audio_" + options.id + "_" + (new Date().getTime()) + ".webm";

    var args = [];

    args.push("-i");
    args.push(options.sourceFilename);

    args.push("-quality");
    args.push("good");

    args.push("-cpu-used");
    args.push("0");

    args.push("-maxrate");
    args.push("500k");

    args.push("-bufsize");
    args.push("1000k");

    args.push("-threads");
    args.push(murrix.config.cacheSlots);

    args.push("-codec:a");
    args.push("libvorbis");

    args.push("-b:a");
    args.push("128k");

    args.push("-ar");
    args.push("44100");

    args.push("-f");
    args.push("webm");

    args.push(tempfile);

    options.temporaryFilenames.push(tempfile);
    options.temporaryFilenames.push(murrix.config.getPathTemp() + "ffmpeg2pass-0.log");
    options.temporaryFilenames.push(murrix.config.getPathTemp() + "av2pass-0.log");

    murrix.utils.run(self.ffmpegPath, args, { cwd: murrix.config.getPathTemp() }, function(error)
    {
      if (error)
      {
        murrix.logger.error(self.name, "Failed to convert audio file, reason: " + error);
        next("break");
        return;
      }

      murrix.logger.info(self.name, "Successfully converted audio file and saved it to " + tempfile + "!");

      options.sourceFilename = tempfile;
      next();
    });
  };

  self._chainCopyFileToCache = function(options, next)
  {
    murrix.utils.copyFile(options.sourceFilename, options.targetFilename, function(error)
    {
      if (error)
      {
        murrix.logger.error(self.name, "Failed to copy, reason: " + error);
        next("break");
        return;
      }

      murrix.logger.info(self.name, "Copied " + options.sourceFilename + " to " + options.targetFilename + " successfully!");

      next();
    });
  };

  self._chainFinal = function(job)
  {
    return function(options)
    {
      murrix.logger.debug(self.name, "Finished job to create " + path.basename(job.options.targetFilename));

      murrix.utils.removeFiles(job.options.temporaryFilenames, function(error)
      {
        if (error)
        {
          murrix.logger.error(self.name, "Failed to remove file, reason: " + error);
        }

        self.runningJobs.splice(self.runningJobs.indexOf(job), 1);

        murrix.client.send("cacheJobDone", { id: path.basename(job.options.targetFilename) });

        self._runQueue();
      });
    };
  };

  self._createImageChain = function(itemData, options, callback)
  {
    var chain = stewardess();

    if (murrix.utils.mimeIsVideo(itemData.exif.MIMEType))
    {
      if (itemData.exif.Compression === "dvsd")
      {
        options.deinterlace = true;
      }

      if (itemData.thumbPosition)
      {
        options.videoPosition = itemData.thumbPosition;
      }

      options.sourceWidth = murrix.utils.intval(itemData.exif.ImageWidth);
      options.sourceHeight = murrix.utils.intval(itemData.exif.ImageHeight);
      options.mirror = itemData.mirror;
      options.angle = itemData.angle;

      chain.add(function(options, next) { self._chainCreateFfmpegImage(options, next); });
      chain.add(function(options, next) { self._chainCreateImage(options, next); });
      chain.add(function(options, next) { self._chainCopyFileToCache(options, next); });

      callback(null, chain);

      return;
    }
    else if (murrix.utils.mimeIsAudio(itemData.exif.MIMEType))
    {
      if (itemData.exif.MIMEType === "audio/mpeg")
      {
        chain.add(function(options, next) { self._chainCreateWavAudio(options, next); });
      }

      chain.add(function(options, next) { self._chainCreateWaveformImage(options, next); });
      chain.add(function(options, next) { self._chainCreateImage(options, next); });
      chain.add(function(options, next) { self._chainCopyFileToCache(options, next); });

      callback(null, chain);

      return;
    }
    else if (murrix.utils.mimeIsImage(itemData.exif.MIMEType))
    {
      if (itemData.exif.MIMEType === "image/x-canon-cr2")
      {
        options.isCr2 = true;
      }

      options.sourceWidth = murrix.utils.intval(itemData.exif.ImageWidth);
      options.sourceHeight = murrix.utils.intval(itemData.exif.ImageHeight);
      options.mirror = itemData.mirror;
      options.angle = itemData.angle;

      chain.add(function(options, next) { self._chainCreateImage(options, next); });
      chain.add(function(options, next) { self._chainCopyFileToCache(options, next); });

      callback(null, chain);

      return;
    }

    callback("Unrecognized MIME-Type, " + itemData.exif.MIMEType);
  };

  self._createVideoChain = function(itemData, options, callback)
  {
    var chain = stewardess();

    if (murrix.utils.mimeIsVideo(itemData.exif.MIMEType))
    {
      if (itemData.exif.Compression === "dvsd")
      {
        options.deinterlace = true;
      }

      options.mirror = itemData.mirror;
      options.angle = itemData.angle;

      chain.add(function(options, next) { self._chainCreateFfmpegVideo(options, next); });
      chain.add(function(options, next) { self._chainCopyFileToCache(options, next); });

      callback(null, chain);

      return;
    }
    else if (murrix.utils.mimeIsAudio(itemData.exif.MIMEType))
    {
      chain.add(function(options, next) { self._chainCreateFfmpegAudio(options, next); });
      chain.add(function(options, next) { self._chainCopyFileToCache(options, next); });

      callback(null, chain);

      return;
    }

    callback("Unrecognized MIME-Type, " + itemData.exif.MIMEType);
  };

  self._findItem = function(id, callback)
  {
    murrix.db.findOne({ _id: id }, "items", function(error, itemData)
    {
      if (error)
      {
        callback(error);
        return;
      }

      if (!itemData)
      {
        callback("Could not find item with id " + id + "!");
        return;
      }

      if (itemData.what !== "file")
      {
        callback("Item with id " + id + " is not a file!");
        return;
      }

      callback(null, itemData);
    });
  };

  self._jobExists = function(targetFilename, callback)
  {
    for (var n = 0; n < self.runningJobs.length; n++)
    {
      if (self.runningJobs[n].options && path.basename(self.runningJobs[n].options.targetFilename) === targetFilename)
      {
        callback(true, "ongoing");
        return;
      }
    }

    var exists = self.queue.exists(targetFilename);

    if (exists)
    {
      callback(true, "queued");
      return;
    }

    callback(false);
  };

  self.queueItem = function(id, options, callback)
  {
    callback = callback || function() {};

    self._findItem(id, function(error, itemData)
    {
      if (error)
      {
        murrix.logger.error(self.name, "Failed to find item, reason: " + error);
        callback("Failed to find item, reason: " + error);
        return;
      }

       if (!murrix.utils.mimeIsImage(itemData.exif.MIMEType) &&
           !murrix.utils.mimeIsVideo(itemData.exif.MIMEType) &&
           !murrix.utils.mimeIsAudio(itemData.exif.MIMEType))
      {
        murrix.logger.debug(self.name, "This MIME type is not cacheable, " + itemData.exif.MIMEType);
        callback("This MIME type is not cacheable, " + itemData.exif.MIMEType);
        return;
      }

      if (options.type === "image")
      {
        options.targetFilename = id + "_" + options.width + "x" + options.height + "_"  + options.square + ".jpg";
      }
      else if (options.type === "video")
      {
        options.targetFilename = id + ".webm";
      }
      else
      {
        murrix.logger.error(self.name, "Can not queue unknown type: " + options.type);
        callback("Can not queue unknown type: " + options.type);
        return;
      }

      fs.exists(murrix.config.getPathCache() + options.targetFilename, function(exists)
      {
        if (exists)
        {
          murrix.logger.info(self.name, options.targetFilename + " already exists, will not create a new version!");
          callback();
          return;
        }

        self._jobExists(options.targetFilename, function(exists)
        {
          if (exists)
          {
            murrix.logger.debug(self.name, "Identical job already exists in queue, filename " + options.targetFilename);
            callback();
            return;
          }

          options.id = id;

          // TODO: If there is slots available push to running directly

          self.queue.push(options.targetFilename, options);

          murrix.logger.debug(self.name, "Queued " + options.targetFilename);

          self._runQueue();
          callback();
        });
      });
    });
  };

  self.processingQueue = false;

  self._runQueue = function()
  {
    if (murrix.server.isStarted() && !self.processingQueue)
    {
      self.processingQueue = true;

      var size = self.queue.size();

      murrix.logger.debug(self.name, "Queue information, " + self.runningJobs.length + " running, " + size + " queued.");

      if (size === 0)
      {
        self.processingQueue = false;
        return;
      }

      if (self.runningJobs.length === 0)
      {
        murrix.logger.debug(self.name, "All " + murrix.config.cacheSlots + " slots free, take on more jobs.");
      }
      else if (self.runningJobs[0].options && self.runningJobs[0].options.type === "video")
      {
        murrix.logger.debug(self.name, "We are running a video job, only one such job can be done at one time.");
        self.processingQueue = false;
        return;
      }
      else if (self.runningJobs.length < murrix.config.cacheSlots)
      {
        murrix.logger.debug(self.name, (murrix.config.cacheSlots - self.runningJobs.length) + " slots free, take on more jobs if there are any.");
      }
      else
      {
        murrix.logger.debug(self.name, "All " + murrix.config.cacheSlots + " slots are used.");
        self.processingQueue = false;
        return;
      }

      var options = self.queue.shift()

      self.processingQueue = false;

      self._startJob(options);
    }
  };

  self._startJob = function(options)
  {
    var job = {};

    murrix.logger.debug(self.name, "Starting creation of " + path.basename(options.targetFilename) + "...");

    job.options = options;

    options.sourceFilename = murrix.config.getPathFiles() + options.id;
    options.targetFilename = murrix.config.getPathCache() + options.targetFilename;
    options.temporaryFilenames = [];

    self.runningJobs.push(job);

    self._findItem(options.id, function(error, itemData)
    {
      if (error)
      {
        murrix.logger.error(self.name, "Failed to find item, reason: " + error);
        self.runningJobs.splice(self.runningJobs.indexOf(job), 1);
        self._runQueue();
        return;
      }

      if (options.type === "image")
      {
        self._createImageChain(itemData, options, function(error, chain)
        {
          if (error)
          {
            murrix.logger.error(self.name, "Failed to create image chain, reason: " + error);
            self.runningJobs.splice(self.runningJobs.indexOf(job), 1);
            self._runQueue();
            return;
          }

          job.chain = chain;

          chain.final(self._chainFinal(job));

          job.chain.run(job.options);

          self._runQueue();
        });
      }
      else if (options.type === "video")
      {
        self._createVideoChain(itemData, options, function(error, chain)
        {
          if (error)
          {
            murrix.logger.error(self.name, "Failed to create video chain, reason: " + error);
            self.runningJobs.splice(self.runningJobs.indexOf(job), 1);
            self._runQueue();
            return;
          }

          job.options = options;
          job.chain = chain;

          chain.final(self._chainFinal(job));

          job.chain.run(job.options);

          self._runQueue();
        });
      }
    });
  };




  self._getFile = function(id, options, callback)
  {
    fs.exists(options.targetFilename, function(exists)
    {
      if (exists)
      {
        fs.stat(options.targetFilename, function(error, stats)
        {
          if (error)
          {
            callback(error);
            return;
          }

          if (stats.size > 0)
          {
            callback(null, options.targetFilename);
            return;
          }

          murrix.logger.error(self.name, "It seems that " + options.targetFilename + " is empty, will remove it and queue a new version!");

          murrix.utils.removeFile(options.targetFilename, function(error)
          {
            if (error)
            {
              murrix.logger.error(self.name, "Failed to remove file, reason: " + error);
              callback("Failed to remove file, reason: " + error);
              return;
            }

            self.queueItem(id, options, function(error)
            {
              callback(error, false);
            });
          });
        });

        return;
      }

      self.queueItem(id, options, function(error)
      {
        callback(error, false);
      });
    });
  };

  self.getImage = function(id, options, callback)
  {
    options.type = "image";
    options.square = murrix.utils.intval(options.square || 0);
    options.width = murrix.utils.intval(options.width || 0);
    options.height = murrix.utils.intval(options.height || 0);
    options.targetFilename = murrix.config.getPathCache() + id + "_" + options.width + "x" + options.height + "_"  + options.square + ".jpg";

    self._getFile(id, options, callback);
  };

  self.getVideo = function(id, options, callback)
  {
    options.type = "video";
    options.targetFilename = murrix.config.getPathCache() + id + ".webm";

    self._getFile(id, options, callback);
  };

  self.getStatus = function(options, callback)
  {
    var targetFilename = false;

    if (options.type === "image")
    {
      targetFilename = options.id + "_" + options.width + "x" + options.height + "_"  + options.square + ".jpg";
    }
    else if (options.type === "video")
    {
      targetFilename = id + ".webm";
    }
    else
    {
      callback("Unknown cache type: " + options.type);
      return;
    }

    fs.exists(murrix.config.getPathCache() + targetFilename, function(exists)
    {
      if (exists)
      {
        callback(null, "available", targetFilename);
        return;
      }

      self._jobExists(targetFilename, function(exists, status)
      {
        if (exists)
        {
          callback(null, status, targetFilename);
          return;
        }

        callback(null, "none", targetFilename);
      });
    });
  };

  self.clear = function(id, excludeFilter, callback)
  {
    fs.readdir(murrix.config.getPathCache(), function(error, list)
    {
      if (error)
      {
        murrix.logger.error(self.name, error);
        callback(error);
        return;
      }

      murrix.logger.info(self.name, "Will clear cache for id " + id);

      var filenames = [];

      for (var n = 0; n < list.length; n++)
      {
        var targetFilename = list[n];

        if (targetFilename.indexOf(id) === -1)
        {
          continue;
        }
        else if (murrix.utils.inArray("video", excludeFilter) && targetFilename.indexOf(".webm") !== -1)
        {
          continue;
        }
        else if (murrix.utils.inArray("image", excludeFilter) && targetFilename.indexOf(".jpg") !== -1)
        {
          continue;
        }

        filenames.push(murrix.config.getPathCache() + targetFilename);
      }

      murrix.utils.removeFiles(filenames, function(error)
      {
        if (error)
        {
          murrix.logger.error(self.name, "Failed to remove file, reason: " + error);
          callback("Failed to remove file, reason: " + error);
          return;
        }

        murrix.logger.info(self.name, "Cached cleared for id " + id);

        callback();
      });
    });
  };
}

util.inherits(MurrixCacheManager, events.EventEmitter);

exports.Manager = MurrixCacheManager;
