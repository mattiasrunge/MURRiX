
var fs = require('fs');
var path = require('path');
var spawn  = require('child_process').spawn;

var exiftoolPath = 'exiftool';
var ffmpegPath = 'ffmpeg';
var convertPath = 'convert';

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

    var error = "";
    var buffer = "";
    var process = spawn(exiftoolPath, [ "-j", "-n", filename ]);

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

      callback(null, JSON.parse(buffer)[0]);
    });

  });
};

function createPreview(originalFilename, targetFilename, options, callback)
{
  var tempfile = "/tmp/imageconvert" + (new Date().getTime()) + options.id;

  var args = [];

  if (options.extension === "cr2")
  {
    originalFilename = "cr2:" + originalFilename;
  }

  args.push(originalFilename);

  if (options.angle)
  {
    args.push("-rotate");
    args.push(options.angle);
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
    args.push("-crop")
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
      args.push("-crop")
      args.push(options.width + "x" + options.height + "+0+0");
    }
  }

  // Width specified, use width and calculate height to keep aspect ratio
  else if (options.width > 0)
  {
    var ratio = options.originalHeight / options.originalWidth;
    var height = options.width * ratio;

    args.push("-resize")
    args.push(options.width + "x" + height);
    args.push("+repage");
  }

  // Height specified, use height and calculate width to keep aspect ratio
  else if (options.height > 0)
  {
    var ratio = options.originalWidth / options.originalHeight;
    var width = options.height * ratio;

    args.push("-resize")
    args.push(width + "x" + options.height);
    args.push("+repage");
  }

  args.push("-strip");
  args.push("-format");
  args.push("jpg");
  args.push("-quality");
  args.push("91");
  args.push(targetFilename);

  var error = "";
  var buffer = "";
  var process = spawn(convertPath, args);

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
        error = "Convert exited with code: " + code;
      }

      console.log(error);
      callback(error);
      return;
    }

    console.log("Success convert", targetFilename);

    callback(null);
  });
};

exports.getPreview = function(session, nodeManager, id, width, height, square, callback)
{
  var filename = path.resolve(__dirname, "./../previews/" + id + "_" + width + "x" + height + "_"  + square + ".jpg");

  fs.exists(filename, function(exists)
  {
    if (exists)
    {
      callback(null, filename);
      return;
    }

    nodeManager.findOne(session, { _id: id }, function(error, nodeData)
    {
      if (error)
      {
        callback(error);
        return;
      }

      convertOptions = [];

      convertOptions.id = id;
      convertOptions.height = height;
      convertOptions.width = width;
      convertOptions.originalHeight = nodeData.exif.ImageHeight;
      convertOptions.originalWidth = nodeData.exif.ImageWidth;
      convertOptions.square = square;
      convertOptions.mirror = nodeData.mirror;
      convertOptions.angle = nodeData.angle;

      var parts = path.extname(nodeData.name).split(".");
      convertOptions.extension = parts[parts.length - 1];

      var originalFilename = path.resolve(__dirname, "../files/" + id);

      switch (nodeData.exif.MIMEType)
      {
        case "video/mpeg":
        case "video/avi":
        case "video/quicktime":
        case "video/x-ms-wmv":
        case "video/mp4":
        case "video/3gpp":
        {
          var tempfile = "/tmp/videoconvert" + (new Date().getTime()) + id + ".jpg";
          var options = [];

          options.push("-i");
          options.push(originalFilename);
          
          if (nodeData.exif.Compression && nodeData.exif.Compression === "dvsd")
          {
            options.push("-deinterlace");
          }

          options.push("-ss");

          if (nodeData.ThumbPosition)
          {
            options.push(nodeData.ThumbPosition);
          }
          else
          {
            options.push("00:00:00");
          }

          options.push("-t");
          options.push("00:00:01");
          options.push("-r");
          options.push("1");
          options.push("-y");
          options.push("-an");
          options.push("-sameq");
          options.push("-f");
          options.push("mjpeg");
          options.push(tempfile);

          error = "";
          var buffer = "";
          var process = spawn(ffmpegPath, options);

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
            if ( code !== 0)
            {
              error = "FFmpeg exited with code: " + code;
              console.log("ERROR", error);

              callback(error);
              return;
            }

            console.log("Creating preview!");

            createPreview(tempfile, filename, convertOptions, function(error)
            {
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

      callback("Can not create preview for MIMEType " + nodeData.exif.MIMEType);
    });
  });
};
