
var call = require("acall.js");
var path = require("path");
var waveform = require("waveform");
var utils = require("../utils");
var i2i = require("./image2image");

exports.run = function(source, destination, callback)
{
  var filenamePng = path.join(destination.path, "audio2image.png");
  var filenameWav = path.join(destination.path, "audio2image.wav");

  if (source.MIMEType !== "audio/wav" || source.MIMEType !== "audio/x-wav")
  {
    var args = [ "ffmpeg" ];
    
    args.push("-i", source.filepath);
    args.push(filenameWav);

    call(args, { cwd: destination.path }, function(error)
    {
      if (error)
      {
        callback("Failed to convert audio to wav, error: " + error);
        return;
      }
      
      args = {};
  
      args.width = destination.width;
      args.height = destination.height;

      args['color-bg'] = "000000ff";
      args['color-center'] = "ffffffff";
      args['color-outer'] = "0088ccff";
      
      waveform(filenameWav, filenamePng, args, function(error)
      {
        if (error)
        {
          callback("Could not create waveform image (B), error: " + error);
          return;
        }
        
        source.filepath = filenamePng;
        source.MIMEType = "image/png";
        
        i2i.run(source, destination, callback);
      });
      
    });
  }
  else
  {
    waveform(source.filepath, filenamePng, args, function(error)
    {
      if (error)
      {
        callback("Could not create waveform image (A), error: " + error);
        return;
      }
      
      source.filepath = filenamePng;
      source.MIMEType = "image/png";
      
      i2i.run(source, destination, callback);
    });
  }
};
