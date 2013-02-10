
var fs = require("fs");
var path = require("path");
var util = require("util");
var stewardess = require("stewardess");
var generateWaveform = require("waveform");

function MurrixCacheManager(murrix)
{
  var self = this;

  self.name = "cache";
  self.runningJobs = [];
  self.imageQueue = [];
  self.videoQueue = [];
  self.slots = 2;
  self.path = "../cache/";
  self.tempPath = "/tmp/";
  self.filesPath = "../files/";

  self.ffmpegPath = "ffmpeg";
  self.convertPath = "convert";
  self.mpg123Path = "mpg123";

  self.videoMimeTypes = [ "video/mpeg", "video/avi", "video/quicktime", "video/x-ms-wmv", "video/mp4", "video/3gpp", "video/x-msvideo" ];
  self.audioMimeTypes = [ "audio/mpeg", "audio/x-wav" ];
  self.imageMimeTypes = [ "image/x-canon-cr2", "image/jpeg", "image/gif", "image/tiff", "image/png", "image/bmp", "image/x-raw" ];

  murrix.on("configurationLoaded", function()
  {
    self.slots = murrix.config.cacheSlots || self.slots;
    self.path = path.resolve(murrix.basePath(), murrix.config.cachePath || self.path) + "/";
    self.filesPath = path.resolve(murrix.basePath(), murrix.config.filesPath || self.filesPath) + "/";
    self.tempPath = path.resolve(murrix.basePath(), murrix.config.tempPath || self.tempPath) + "/";

    fs.exists(self.path, function(exists)
    {
      if (exists)
      {
        return;
      }

      fs.mkdir(self.path, 0770, function(error)
      {
        if (error)
        {
          murrix.logger.error(self.name, error);
          return;
        }

        murrix.logger.info(self.name, "Created cache directory at " + self.path);
      });
    });
  });

  self._chainCreateImage = function(options, next)
  {
    var tempfile = self.tempPath + "murrix_cache_create_image_" + options.id + "_" + (new Date().getTime() + ".jpg");

    var args = [];

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
      var ratio = options.sourceHeight / options.sourceWidth;
      var height = options.width * ratio;

      args.push("-resize");
      args.push(options.width + "x" + height);
      args.push("+repage");
    }

    // Height specified, use height and calculate width to keep aspect ratio
    else if (options.height > 0)
    {
      var ratio = options.sourceWidth / options.sourceHeight;
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

    murrix.utils.run(self.convertPath, args, { cwd: self.tempPath }, function(error)
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
    var tempfile = self.tempPath + "murrix_cache_create_ffmpeg_image_" + options.id + "_" + (new Date().getTime() + ".jpg");

    var args = [];

    args.push("-i");
    args.push(options.sourceFilename);

    if (options.deinterlace)
    {
      args.push("-deinterlace");
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

    murrix.utils.run(self.ffmpegPath, args, { cwd: self.tempPath }, function(error)
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
    var tempfile = self.tempPath + "murrix_cache_create_mpg123_audio_" + options.id + "_" + (new Date().getTime() + ".wav");

    var args = [];

    args.push("-w");
    args.push(tempfile);
    args.push(options.sourceFilename);

    options.temporaryFilenames.push(tempfile);

    murrix.utils.run(self.mpg123Path, args, { cwd: self.tempPath }, function(error)
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
    var tempfile = self.tempPath + "murrix_cache_create_waveform_image_" + options.id + "_" + (new Date().getTime() + ".png");

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
    var tempfile1 = self.tempPath + "murrix_cache_create_ffmpeg_video1_" + options.id + "_" + (new Date().getTime() + ".webm");
    var tempfile2 = self.tempPath + "murrix_cache_create_ffmpeg_video2_" + options.id + "_" + (new Date().getTime() + ".webm");

    var args = [];

    args.push("-i");
    args.push(options.sourceFilename);

    if (options.deinterlace)
    {
      args.push("-deinterlace");
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
    args.push(self.slots);

    var argsPass1 = [];
    argsPass1.push("-an");

    argsPass1.push("-pass");
    argsPass1.push("1");

    argsPass1.push("-f");
    argsPass1.push("webm");

    argsPass1.push(tempfile1);

    options.temporaryFilenames.push(tempfile1);
    options.temporaryFilenames.push(self.tempPath + "ffmpeg2pass-0.log");
    options.temporaryFilenames.push(self.tempPath + "av2pass-0.log");

    murrix.utils.run(self.ffmpegPath, args.concat(argsPass1), { cwd: self.tempPath }, function(error)
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

      murrix.utils.run(self.ffmpegPath, args.concat(argsPass2), { cwd: self.tempPath }, function(error)
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
    var tempfile = self.tempPath + "murrix_cache_create_ffmpeg_audio_" + options.id + "_" + (new Date().getTime() + ".webm");

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
    args.push(self.slots);

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
    options.temporaryFilenames.push(self.tempPath + "ffmpeg2pass-0.log");
    options.temporaryFilenames.push(self.tempPath + "av2pass-0.log");

    murrix.utils.run(self.ffmpegPath, args, { cwd: self.tempPath }, function(error)
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
    var is = fs.createReadStream(options.sourceFilename);
    var os = fs.createWriteStream(options.targetFilename);


    util.pump(is, os, function(error)
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

  self._runQueue = function()
  {
    // Check if we can take on more jobs
    if (self.runningJobs.length === 0)
    {
      murrix.logger.debug(self.name, "All " + self.slots + " slots free, take on more jobs.");
    }
    else if (self.runningJobs[0].options.type === "video")
    {
      murrix.logger.debug(self.name, "We are running a video job, only one such job can be done at one time.");
      return;
    }
    else if (self.runningJobs.length < self.slots)
    {
      murrix.logger.debug(self.name, (self.slots - self.runningJobs.length) + " slots free, take on more jobs if there are any.");
    }
    else
    {
      murrix.logger.debug(self.name, "All " + self.slots + " slots are used.");
      return;
    }



    // Fill up running queue with new jobs if any exists
    while (self.runningJobs.length < self.slots && (self.imageQueue.length !== 0 || self.videoQueue.length !== 0))
    {
      if (self.imageQueue.length > 0)
      {
        self.runningJobs.push(self.imageQueue.shift());
        continue;
      }

      self.runningJobs.push(self.videoQueue.shift());
      break;
    }


    // Start newly added jobs to the running queue
    for (var n = 0; n < self.runningJobs.length; n++)
    {
      var job = self.runningJobs[n];

      if (!job.started)
      {
        job.started = true;

        murrix.logger.debug(self.name, "Starting job to create " + job.options.targetFilename);

        job.chain.final(function(options)
        {
          murrix.logger.debug(self.name, "Finished job to create " + job.options.targetFilename);

          for (var i = 0; i < job.options.temporaryFilenames.length; i++)
          {
            murrix.utils.removeFile(job.options.temporaryFilenames[i]); // TODO: Wait for completion, if this is a video job and the job after is also a video we might remove the ffmpeg logfiles for the next job...
          }

          self.runningJobs.splice(self.runningJobs.indexOf(job), 1);

          self._runQueue();
        });

        job.chain.run(job.options);
      }
    }

    murrix.logger.debug(self.name, "There are now " + self.runningJobs.length + " jobs running.");
    murrix.logger.debug(self.name, "Image queue holds " + self.imageQueue.length + " jobs.");
    murrix.logger.debug(self.name, "Video queue holds " + self.videoQueue.length + " jobs.");
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
    for (var n = 0; n < self.imageQueue.length; n++)
    {
      if (self.imageQueue[n].options.targetFilename === targetFilename)
      {
        callback(true, "queued");
      }
    }

    for (var n = 0; n < self.videoQueue.length; n++)
    {
      if (self.videoQueue[n].options.targetFilename === targetFilename)
      {
        callback(true, "queued");
      }
    }

    for (var n = 0; n < self.runningJobs.length; n++)
    {
      if (self.runningJobs[n].options.targetFilename === targetFilename)
      {
        callback(true, "ongoing");
      }
    }

    callback(false);
  };


  self._createImageChain = function(itemData, options, callback)
  {
    var chain = stewardess();

    if (murrix.utils.inArray(itemData.exif.MIMEType, self.videoMimeTypes))
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

      chain.add(function(options, next) { self._chainCreateFfmpegImage(options, next); });
      chain.add(function(options, next) { self._chainCreateImage(options, next); });
      chain.add(function(options, next) { self._chainCopyFileToCache(options, next); });

      callback(null, chain);

      return;
    }
    else if (murrix.utils.inArray(itemData.exif.MIMEType, self.audioMimeTypes))
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
    else if (murrix.utils.inArray(itemData.exif.MIMEType, self.imageMimeTypes))
    {
      if (itemData.exif.MIMEType === "image/x-canon-cr2")
      {
        options.isCr2 = true;
      }

      options.sourceWidth = murrix.utils.intval(itemData.exif.ImageWidth);
      options.sourceHeight = murrix.utils.intval(itemData.exif.ImageHeight);

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

    if (murrix.utils.inArray(itemData.exif.MIMEType, self.videoMimeTypes))
    {
      if (itemData.exif.Compression === "dvsd")
      {
        options.deinterlace = true;
      }

      chain.add(function(options, next) { self._chainCreateFfmpegVideo(options, next); });
      chain.add(function(options, next) { self._chainCopyFileToCache(options, next); });

      callback(null, chain);

      return;
    }
    else if (murrix.utils.inArray(itemData.exif.MIMEType, self.audioMimeTypes))
    {
      chain.add(function(options, next) { self._chainCreateFfmpegAudio(options, next); });
      chain.add(function(options, next) { self._chainCopyFileToCache(options, next); });

      callback(null, chain);

      return;
    }

    callback("Unrecognized MIME-Type, " + itemData.exif.MIMEType);
  };


  self.queueItem = function(id, options)
  {
    if (options.type === "image")
    {
      options.targetFilename = self.path + id + "_" + options.width + "x" + options.height + "_"  + options.square + ".jpg";
    }
    else if (options.type === "video")
    {
      options.targetFilename = self.path + id + ".webm";
    }
    else
    {
      murrix.logger.error(self.name, "Can not queue unknown type: " + options.type);
      return;
    }

    self._findItem(id, function(error, itemData)
    {
      if (error)
      {
        murrix.logger.error(self.name, "Failed to queue image, reason: " + error);
        return;
      }

      self._jobExists(options.targetFilename, function(exists)
      {
        if (exists)
        {
          murrix.logger.debug(self.name, "Identical job already exists in queue, filename " + options.targetFilename);
          return;
        }

        options.id = id;
        options.sourceFilename = self.filesPath + id;
        options.temporaryFilenames = [];
        options.mirror = itemData.mirror;
        options.angle = itemData.angle;

        var job = {};

        job.started = false;
        job.options = options;

        if (options.type === "image")
        {
          self._createImageChain(itemData, options, function(error, chain)
          {
            if (error)
            {
              murrix.logger.error(self.name, "Failed to create image chain, reason: " + error);
              return;
            }

            job.chain = chain;

            self.imageQueue.push(job);
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
              return;
            }

            job.chain = chain;

            self.videoQueue.push(job);
            self._runQueue();
          });
        }
      });
    });
  };


  self.getImage = function(id, options, callback)
  {
    options.type = "image";
    options.square = murrix.utils.intval(options.square || 0);
    options.width = murrix.utils.intval(options.width || 0);
    options.height = murrix.utils.intval(options.height || 0);
    options.targetFilename = self.path + id + "_" + options.width + "x" + options.height + "_"  + options.square + ".jpg";

    fs.exists(options.targetFilename, function(exists)
    {
      if (exists)
      {
        callback(null, options.targetFilename);
        return;
      }

      self.queueItem(id, options);

      callback(null, false);
    });
  };

  self.getVideo = function(id, options, callback)
  {
    options.type = "video";
    options.targetFilename = self.path + id + ".webm";

    fs.exists(options.targetFilename, function(exists)
    {
      if (exists)
      {
        callback(null, options.targetFilename);
        return;
      }

      self.queueItem(id, options);

      callback(null, false);
    });
  };


  self.getStatus = function(options, callback)
  {
    var targetFilename = false;

    if (options.type === "image")
    {
      targetFilename = self.path + options.id + "_" + options.width + "x" + options.height + "_"  + options.square + ".jpg";
    }
    else if (options.type === "video")
    {
      targetFilename = self.path + id + ".webm";
    }
    else
    {
      callback("Unknown cache type: " + options.type);
      return;
    }

    fs.exists(targetFilename, function(exists)
    {
      if (exists)
      {
        callback(null, "available");
        return;
      }

      self._jobExists(targetFilename, function(exists, status)
      {
        if (exists)
        {
          callback(null, status);
          return;
        }

        callback(null, "none");
      });
    });
  };

  self.clear = function(id, callback)
  {
    fs.readdir(self.path, function(error, list)
    {
      if (error)
      {
        murrix.logger.error(self.name, error);
        callback(error);
        return;
      }

      murrix.logger.info(self.name, "Will clear cache for id " + id);

      var chain = stewardess();

      for (var n = 0; n < list.length; n++)
      {
        var targetFilename = list[n];

        if (targetFilename.indexOf(id) === -1)
        {
          continue;
        }

        chain.add(function(options, next)
        {
          murrix.utils.removeFile(self.path + targetFilename, function()
          {
            next();
          });
        });
      }

      chain.final(function(options)
      {
        murrix.logger.info(self.name, "Cached cleared for id " + id);

        callback();
      });

      chain.run({});
    });
  };
}

exports.Manager = MurrixCacheManager;
