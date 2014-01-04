
var call = require("acall.js");
var path = require("path");
var utils = require("../utils");

exports.run = function(source, destination, callback)
{
  var filename = path.join(destination.path, "video2video_pass2.webm");
  var args = [ "ffmpeg" ];

  args.push("-i", source.filepath);

  if (destination.deinterlace === true || destination.deinterlace === 'true')
  {
    args.push("-filter:v", "yadif");
  }

  if (destination.angle === 90)
  {
    args.push("-vf", "transpose=2");
  }
  else if (destination.angle === 270)
  {
    args.push("-vf", "transpose=1");
  }
  else if (destination.angle === 180)
  {
    args.push("-vf", "transpose=1,transpose=1");
  }

  args.push("-codec:v", "libvpx");
  args.push("-quality", "good");
  args.push("-cpu-used", 0);
  args.push("-b:v", "500k");
  args.push("-qmin", 10);
  args.push("-qmax", 42);
  args.push("-maxrate", "500k");
  args.push("-bufsize", "1000k");
  args.push("-threads", destination.cpuCount || 1);
  
  var argsPass1 = [];
  
  argsPass1.push("-an");
  argsPass1.push("-pass", 1);
  argsPass1.push("-f", "webm");
  argsPass1.push(path.join(destination.path, "video2video_pass1.webm"));

  call(args.concat(argsPass1), { cwd: destination.path }, function(error)
  {
    if (error)
    {
      callback("Failed to convert video on first pass, error: " + error);
      return;
    }

    var argsPass2 = [];

    argsPass2.push("-codec:a", "libvorbis");
    argsPass2.push("-b:a", "128k");
    argsPass2.push("-ar", 44100);
    argsPass2.push("-pass", 2);
    argsPass2.push("-f", "webm");
    argsPass2.push(filename);

    call(args.concat(argsPass2), { cwd: destination.path }, function(error)
    {
      if (error)
      {
        callback("Failed to convert video on second pass, error: " + error);
        return;
      }

      callback(null, filename);
    });
  });
};
