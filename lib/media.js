
var os = require("os");
var fs = require("fs");
var path = require("path");
var q = require("q");
var utils = require("./utils");
var a2a = require("./media/audio2audio");
var a2i = require("./media/audio2image");
var i2i = require("./media/image2image");
var v2i = require("./media/video2image");
var v2v = require("./media/video2video");

var cpuCount = 1;
var jobList = {};
var filesPath = path.join(__dirname, "..", "files");
var mediaPath = path.join(__dirname, "..", "cache");

function run(instance, source, destination, callback)
{
  utils.file.createTempDirectory(function(error, dirpath)
  {
    if (error)
    {
      callback("Could not create temporary directory, error: " + error);
      return;
    }
    
    destination.path = dirpath;
  
    instance.run(source, destination, function(error, filepath)
    {
      if (error)
      {
        utils.file.remove(dirpath);
        callback("Could not run conversion process, error: " + error);
        return;
      }
        
      utils.file.copy(filepath, destination.filepath, function(error)
      {
        utils.file.remove(dirpath);
        
        if (error)
        {
          callback("Failed to copy, reason: " + error);
          return;
        }

        callback();
      });
    });
  });
}

function constructFilename(options)
{
  var square = options.width === options.height ? 1 : 0;
  var height = options.height ? options.height : 0;
  var extension = options.type === "image" ? "jpg" : "webm";
  
  return options.id + "_" + options.width + "x" + height + "_"  + square + "." + extension;
}

exports.initialize = function(config, callback)
{
  config = config || {};
  config.media = config.media || {};
  config.files = config.files || {};
  
  mediaPath = config.media.path ? path.resolve(config.media.path) : mediaPath;
  filesPath = config.files.path ? path.resolve(config.files.path) : filesPath;
  cpuCount = os.cpus().length;
  
  callback();
};

exports.create = function(filepath, destination, callback)
{
  utils.file.mimetype(filepath, function(error, mimetype)
  {
    if (error)
    {
      callback(error);
      return;
    }
    
    var source = {};
    
    source.filepath = filepath;
    source.MIMEType = mimetype;
      
    if (utils.file.isImage(source.MIMEType))
    {
      if (destination.type === "image")
      {
        run(i2i, source, destination, callback);
        return;
      }
    }
    else if (utils.file.isVideo(source.MIMEType))
    {
      if (destination.type === "video")
      {
        run(v2v, source, destination, callback);
        return;
      }
      else if (destination.type === "image")
      {
        run(v2i, source, destination, callback);
        return;
      }
    }
    else if (utils.file.isAudio(source.MIMEType))
    {
      if (destination.type === "audio")
      {
        run(a2a, source, destination, callback);
        return;
      }
      else if (destination.type === "image")
      {
        run(a2i, source, destination, callback);
        return;
      }
    }
    
    callback("Unknown conversion path from source type to destination path");
  });
};

exports.runJobs = function()
{
  var imageJobsNotRunning = [];
  var videoAudioJobsNotRunning = [];
  var imageJobsRunningCount = 0;
  var videoAudioJobsRunningCount = 0;
  var jobsToStart = [];
  
  for (var filename in jobList)
  {
    var job = jobList[filename];
    var options = job.jobOptions;
    
    if (options.type === "image")
    {
      options.running ? imageJobsRunningCount++ : imageJobsNotRunning.push(job);
    }
    else if (options.type === "video" || options.type === "audio")
    {
      options.running ? videoAudioJobsRunningCount++ : videoAudioJobsNotRunning.push(job);
    }
  }
  
  for (var n = 0; n < Math.min(imageJobsNotRunning.length - imageJobsRunningCount, cpuCount); n++)
  {
    jobsToStart.push(imageJobsNotRunning[n]);
  }
  
  for (var n = 0; n < Math.min(videoAudioJobsNotRunning.length - videoAudioJobsRunningCount, 1); n++)
  {
    jobsToStart.push(videoAudioJobsNotRunning[n]);
  }
  
  for (var n = 0; n < jobsToStart.length; n++)
  {
    var job = jobsToStart[n];
    var options = job.jobOptions;
    var filename = constructFilename(options);
    
    options.running = true;

    exports.create(path.join(filesPath, options.id), options, function(error)
    {
      delete jobList[filename];
      
      error ? job.reject(error) : job.resolve();
      
      exports.runJobs();
    });
  }
};

exports.get = function(options, callback)
{
  var filename = constructFilename(options);
  callback = callback || function() {};
  
  options.filepath = path.join(mediaPath, filename);

  fs.exists(options.filepath, function(exists)
  {
    if (exists)
    {
      callback(null, options.filepath);
      return;
    }
    
    if (!jobList[filename])
    {
      var job = q.defer();

      job.jobOptions = options;
      job.jobOptions.running = false;
      job.jobOptions.cpuCount = cpuCount;
      
      jobList[filename] = job;
    }

    jobList[filename].promise.then(function()
    {
      callback(null, options.filepath);
    },
    function(error)
    {
      callback(error);
    });
    
    exports.runJobs();
  });
};

exports.clear = function(id, callback)
{
  
};
