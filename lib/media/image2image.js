
var im = require("imagemagick");
var path = require("path");

exports.run = function(source, destination, callback)
{
  var args = {};
  
  args.srcPath = source.filepath;
  args.dstPath = path.join(destination.path, "image2image.jpg");
  args.strip = true;
  args.crop = false;
  args.quality = 0.91;
  args.format = "jpg";
  args.customArgs = [];
  
  destination.angle = parseInt(destination.angle, 10);
  
  if (!isNaN(destination.angle) && destination.angle)
  {
    args.customArgs.push("-rotate", -destination.angle, "+repage");
  }

  if (destination.mirror === true || destination.mirror === 'true')
  {
    args.customArgs.push("-flop", "+repage");
  }
  
  if (destination.width)
  {
    args.width = destination.width;
  }
  
  if (destination.height)
  {
    args.height = destination.height;
    args.crop = true;
  }
  
  if (source.MIMEType === "image/x-canon-cr2")
  {
    args.srcPath = "cr2:" + args.srcPath;
  }
  else if (source.MIMEType === "image/x-nikon-nef")
  {
    args.srcPath = "nef:" + args.srcPath;
  }
  
  if (args.crop)
  {
    im.crop(args, function(error)
    {
      callback(error, args.dstPath);
    });
  }
  else
  {
    im.resize(args, function(error)
    {
      callback(error, args.dstPath);
    });
  }
};
