
var fs = require('fs');
var path = require('path');
var spawn  = require('child_process').spawn;
var MurrixUtils = require('./utils.js');
var generateWaveform = require('waveform');

var exiftoolPath = 'exiftool';
var ffmpegPath = 'ffmpeg';
var convertPath = 'convert';
var mpg123Path = 'mpg123';

// Inspired by https://github.com/simme/node-exift
exports.readExif = function(filename, callback)
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

    MurrixUtils.runCommand(exiftoolPath, args, {}, function(error, output)
    {
      if (error)
      {
        console.log(error);
        callback(error);
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
        console.log("Could not parse exif output! " + filename);
        console.log(output);
        callback(e.toString());
      }
    });
  });
};

function createPreview(originalFilename, targetFilename, options, callback)
{
  var tempfile = "/tmp/imageconvert" + (new Date().getTime()) + options.id;

  var args = [];
  var ratio = 1;
  var width = 0;
  var height = 0;

  if (options.isCr2)
  {
    originalFilename = "cr2:" + originalFilename;
  }

  args.push(originalFilename);

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
    if (options.width > options.height && options.originalWidth > options.originalHeight)
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
    ratio = options.originalHeight / options.originalWidth;
    height = options.width * ratio;

    args.push("-resize");
    args.push(options.width + "x" + height);
    args.push("+repage");
  }

  // Height specified, use height and calculate width to keep aspect ratio
  else if (options.height > 0)
  {
    ratio = options.originalWidth / options.originalHeight;
    width = options.height * ratio;

    args.push("-resize");
    args.push(width + "x" + options.height);
    args.push("+repage");
  }

  args.push("-strip");
  args.push("-format");
  args.push("jpg");
  args.push("-quality");
  args.push("91");
  args.push(targetFilename);

  MurrixUtils.runCommand(convertPath, args, {}, function(error, output)
  {
    if (error)
    {
      console.log(error);
      callback(error);
      return;
    }

    fs.exists(targetFilename, function(exists)
    {
      if (!exists)
      {
        console.log("Strange, got no error but converted file does not exists!", targetFilename);
        callback("Convertion seems to have failed!");
        return;
      }

      console.log("Success convert", targetFilename);

      callback(null);
    });
  });
};

function CreateWaveform(inputFilename, outputFilename, convertOptions, square, width, height, callback)
{
  console.log("Creating waveform!");

  var tempfile = "/tmp/audioconvert" + (new Date().getTime()) + ".png";

  var options = {};

  if (square)
  {
    options.width = Math.max(width, height);
    options.height = Math.max(width, height);
  }
  else
  {
    options.width = 720;
    options.height = 288;
  }

  options['color-bg'] = "000000ff";
  options['color-center'] = "ffffffff";
  options['color-outer'] = "0088ccff";

  generateWaveform(inputFilename, tempfile, options, function(error)
  {
    if (error)
    {
      console.log(error);
      callback(error);
      return;
    }

    console.log("Creating preview!");

    createPreview(tempfile, outputFilename, convertOptions, function(error)
    {
      MurrixUtils.removeFile(tempfile);

      if (error)
      {
        callback(error);
        return;
      }

      callback(null, outputFilename);
    });
  });
};

exports.getPreview = function(session, nodeManager, id, width, height, square, callback)
{
  if (!square)
  {
    square = 0;
  }

  if (!width)
  {
    width = 0;
  }

  if (!height)
  {
    height = 0;
  }

  var filename = path.resolve(__dirname, "./../cache/" + id + "_" + width + "x" + height + "_"  + square + ".jpg");

  fs.exists(filename, function(exists)
  {
    if (exists)
    {
      callback(null, filename);
      return;
    }

    nodeManager.findOne(session, { _id: id }, "items", function(error, itemData)
    {
      if (error)
      {
        callback(error);
        return;
      }

      if (!itemData)
      {
        console.log("Could not find item with id " + id);
        callback("Could not find item with id " + id);
        return;
      }

      if (itemData.what !== "file")
      {
        callback("Can not get preview on item that is not a file!");
        return;
      }

      var convertOptions = [];

      convertOptions.id = id;
      convertOptions.height = height;
      convertOptions.width = width;
      convertOptions.originalHeight = itemData.exif.ImageHeight || 576;
      convertOptions.originalWidth = itemData.exif.ImageWidth || 720;
      convertOptions.square = square;
      convertOptions.mirror = itemData.mirror || false;
      convertOptions.angle = itemData.angle || false;

      var originalFilename = path.resolve(__dirname, "../files/" + id);

      switch (itemData.exif.MIMEType)
      {
        case "video/mpeg":
        case "video/avi":
        case "video/quicktime":
        case "video/x-ms-wmv":
        case "video/mp4":
        case "video/3gpp":
        case "video/x-msvideo":
        {
          var tempfile = "/tmp/videoconvert" + (new Date().getTime()) + id + ".jpg";
          var args = [];

          args.push("-i");
          args.push(originalFilename);

          if (itemData.exif.Compression && itemData.exif.Compression === "dvsd") // TODO: Does this work?
          {
            args.push("-deinterlace");
          }

          args.push("-ss");

          if (itemData.thumbPosition)
          {
            args.push(itemData.thumbPosition);
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

          MurrixUtils.runCommand(ffmpegPath, args, {}, function(error, output)
          {
            if (error)
            {
              MurrixUtils.removeFile(tempfile);
              console.log(error);
              callback(error);
              return;
            }

            console.log("Creating preview!");

            createPreview(tempfile, filename, convertOptions, function(error)
            {
              MurrixUtils.removeFile(tempfile);

              if (error)
              {
                callback(error);
                return;
              }

              callback(null, filename);
            });
          });

          return;
        }
        case "audio/mpeg":
        {
          var tempfile = "/tmp/audioconvert" + (new Date().getTime()) + id + ".wav";
          var args = [];

          args.push("-w");
          args.push(tempfile);
          args.push(originalFilename);

          MurrixUtils.runCommand(mpg123Path, args, {}, function(error, output)
          {
            if (error)
            {
              MurrixUtils.removeFile(tempfile);
              console.log(error);
              callback(error);
              return;
            }

            CreateWaveform(tempfile, filename, convertOptions, square, width, height, function(error, filename)
            {
              if (error)
              {
                MurrixUtils.removeFile(tempfile);
                callback(error);
                return;
              }

              callback(null, filename);
            });
          });

          return;
        }
        case "audio/x-wav":
        {
          CreateWaveform(originalFilename, filename, convertOptions, square, width, height, callback);

          return;
        }
        case "image/x-canon-cr2":
        {
          convertOptions.isCr2 = true;

          // Fall through
        }
        case "image/jpeg":
        case "image/gif":
        case "image/tiff":
        case "image/png":
        case "image/bmp":
        case "image/x-raw":
        {
          createPreview(originalFilename, filename, convertOptions, function(error)
          {
            if (error)
            {
              callback(error);
              return;
            }

            callback(null, filename);
          });

          return;
        }
      }

      callback("Can not create preview for MIMEType " + itemData.exif.MIMEType);
    });
  });
};

exports._videoQueue = [];

function createVideo(nodeManager)
{
  if (exports._videoQueue.length === 0)
  {
    console.log("No more videos queued!");
    return;
  }

  var filename = path.resolve(__dirname, "./../cache/" + exports._videoQueue[0].id + ".webm");

  console.log("Create video called for " + filename, ", queue length is " + exports._videoQueue.length);

  fs.exists(filename, function(exists)
  {
    if (exists)
    {
      exports._videoQueue[0].callback(null, filename);
      exports._videoQueue.shift();
      createVideo(nodeManager);
      return;
    }

    nodeManager.findOne(exports._videoQueue[0].session, { _id: exports._videoQueue[0].id }, "items", function(error, itemData)
    {
      if (error)
      {
        exports._videoQueue[0].callback(error);
        exports._videoQueue.shift();
        createVideo(nodeManager);

        return;
      }

      if (!itemData)
      {
        console.log("Could not find item with id " + exports._videoQueue[0].id);

        exports._videoQueue[0].callback("Could not find item with id " + exports._videoQueue[0].id);
        exports._videoQueue.shift();
        createVideo(nodeManager);

        return;
      }

      if (itemData.what !== "file")
      {
        exports._videoQueue[0].callback("Can not get preview on item that is not a file!");
        exports._videoQueue.shift();
        createVideo(nodeManager);

        return;
      }

      var originalFilename = path.resolve(__dirname, "../files/" + exports._videoQueue[0].id);

      switch (itemData.exif.MIMEType)
      {
        case "video/mpeg":
        case "video/avi":
        case "video/quicktime":
        case "video/x-ms-wmv":
        case "video/mp4":
        case "video/3gpp":
        case "video/x-msvideo":
        {
          var tempfile1 = "/tmp/videogenerate" + (new Date().getTime()) + exports._videoQueue[0].id + "_1";
          var args = [];

          args.push("-i");
          args.push(originalFilename);

//            args.push("-vf");
//            args.push("mp=eq2=1.5:2");


          if (itemData.exif.Compression && itemData.exif.Compression === "dvsd")
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
          args.push("4");

          var args1 = [];
          args1.push("-an");

          args1.push("-pass");
          args1.push("1");

          args1.push("-f");
          args1.push("webm");

          args1.push(tempfile1);

          MurrixUtils.runCommand(ffmpegPath, args.concat(args1), { cwd: "/tmp" }, function(error, output)
          {
            if (error)
            {
              MurrixUtils.removeFile("./ffmpeg2pass-0.log");
              MurrixUtils.removeFile(tempfile1);
              console.log(error);

              exports._videoQueue[0].callback(error);
              exports._videoQueue.shift();
              createVideo(nodeManager);

              return;
            }

            var args2 = [];
            args2.push("-codec:a");
            args2.push("libvorbis");

            args2.push("-b:a");
            args2.push("128k");

            args2.push("-ar");
            args2.push("44100");

            args2.push("-pass");
            args2.push("2");

            args2.push("-f");
            args2.push("webm");

            args2.push(filename);

            MurrixUtils.runCommand(ffmpegPath, args.concat(args2), { cwd: "/tmp" }, function(error, output)
            {
              MurrixUtils.removeFile("./ffmpeg2pass-0.log");
              MurrixUtils.removeFile("./av2pass-0.log");
              MurrixUtils.removeFile(tempfile1);

              if (error)
              {
                MurrixUtils.removeFile(filename);
                console.log(error);

                exports._videoQueue[0].callback(error);
                exports._videoQueue.shift();
                createVideo(nodeManager);

                return;
              }

              console.log("Finished creating video " + filename);
              exports._videoQueue[0].callback(null, filename);
              exports._videoQueue.shift();
              createVideo(nodeManager);
            });
          });

          return;
        }
        case "audio/mpeg":
        case "audio/x-wav":
        {
          var args = [];

          args.push("-i");
          args.push(originalFilename);

          args.push("-quality");
          args.push("good");

          args.push("-cpu-used");
          args.push("0");

          args.push("-maxrate");
          args.push("500k");

          args.push("-bufsize");
          args.push("1000k");

          args.push("-threads");
          args.push("4");

          args.push("-codec:a");
          args.push("libvorbis");

          args.push("-b:a");
          args.push("128k");

          args.push("-ar");
          args.push("44100");

          args.push("-f");
          args.push("webm");

          args.push(filename);

          MurrixUtils.runCommand(ffmpegPath, args, { cwd: "/tmp" }, function(error, output)
          {
            MurrixUtils.removeFile("./ffmpeg2pass-0.log");
            MurrixUtils.removeFile("./av2pass-0.log");

            if (error)
            {
              MurrixUtils.removeFile(filename);
              console.log(error);

              exports._videoQueue[0].callback(error);
              exports._videoQueue.shift();
              createVideo(nodeManager);

              return;
            }

            console.log("Finished creating audio " + filename);
            exports._videoQueue[0].callback(null, filename);
            exports._videoQueue.shift();
            createVideo(nodeManager);
          });

          return;
        }
      }

      console.log("Can not create video/audio for MIMEType " + itemData.exif.MIMEType);
      exports._videoQueue[0].callback("Can not create video/audio for MIMEType " + itemData.exif.MIMEType);
      exports._videoQueue.shift();
      createVideo(nodeManager);
    });
  });
}

exports.getVideo = function(session, nodeManager, id, callback)
{
  var filename = path.resolve(__dirname, "./../cache/" + id + ".webm");

  fs.exists(filename, function(exists)
  {
    if (exists)
    {
      callback(null, filename);
      return;
    }

    exports._videoQueue.push({ session: session, id: id, callback: callback });

    if (exports._videoQueue.length > 1)
    {
      console.log("Create video queued for " + filename, ", queue length is " + exports._videoQueue.length);
      return;
    }

    createVideo(nodeManager);
  });
};

exports.clearCache = function(session, id, callback)
{
  // TODO: Check rights

  var dir = path.resolve(__dirname, "./../cache");

  fs.readdir(dir, function(error, list)
  {
    if (error)
    {
      console.log(error)
      callback(error);
      return;
    }

    if (list.length === 0)
    {
      callback(null);
    }

    var pending = list.length;

    list.forEach(function(file)
    {
      if (file.indexOf(id) !== -1)
      {
        console.log("Will remove " + dir + "/" + file);
        MurrixUtils.removeFile(dir + "/" + file, function()
        {
          pending--;

          if (pending === 0)
          {
            callback(null);
          }
        });
      }
      else
      {
        pending--;

        if (pending === 0)
        {
          callback(null);
        }
      }
    });
  });
};
