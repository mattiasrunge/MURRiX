
var call = require("acall.js");
var path = require("path");

exports.run = function(source, destination, callback)
{
  var filename = path.join(destination.path, "audio2audio.webm");
  var args = [ "ffmpeg" ];
  
  args.push("-i", source.filepath);
  args.push("-quality", "good");
  args.push("-cpu-used", 0);
  args.push("-maxrate", "500k");
  args.push("-bufsize", "1000k");
  args.push("-threads", destination.cpuCount || 1);
  args.push("-codec:a", "libvorbis");
  args.push("-b:a", "128k");
  args.push("-ar", 44100);
  args.push("-f", "webm");
  args.push(filename);
  
  call(args, { cwd: destination.path }, function(error)
  {
    if (error)
    {
      callback("Failed to convert audio, error: " + error);
      return;
    }

    callback(null, filename);
  });
};
