
var call = require("acall.js");
var path = require("path");
var i2i = require("./image2image");

exports.run = function(source, destination, callback)
{
  var filename = path.join(destination.path, "video2image.jpg");
  var args = [ "ffmpeg" ];
  
  args.push("-i", source.filepath);
  
  if (destination.deinterlace)
  {
    args.push("-filter:v", "yadif");
  }

  args.push("-ss", destination.timeindex ? destination.timeindex : "00:00:00");
  args.push("-t", "00:00:01");
  args.push("-r", "1");
  args.push("-y");
  args.push("-an");
  args.push("-qscale", "0");
  args.push("-f", "mjpeg");
  args.push(filename);
  
  call(args, { cwd: destination.path }, function(error)
  {
    if (error)
    {
      callback("Failed to convert video to image, error: " + error);
      return;
    }

    source.filepath = filename;
    source.MIMEType = "image/jpeg";
    
    i2i.run(source, destination, callback);
  });
};
