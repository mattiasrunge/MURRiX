
var proxyquire = require("proxyquire");
var assert = require("assert");

suite("utils", function()
{
  suite("file", function()
  {
    var _fs = {};
    var _file = proxyquire("../file.js", { "fs": _fs });

    setup(function()
    {
      _fs._real_exists = _fs.exists;
      _fs.exists = function(path, callback)
      {
        if (path.indexOf("exists") !== -1)
        {
          callback(true);
        }
        else
        {
          callback(false);
        }
      };

      _fs._real_mkdir = _fs.mkdir;
      _fs.mkdir = function(path, mask, callback)
      {
        if (path.indexOf("fail") !== -1)
        {
          callback("error");
          return;
        }

        callback();
      };

      _fs._real_unlink = _fs.unlink;
      _fs.unlink = function(path, callback)
      {
        if (path.indexOf("fail") !== -1)
        {
          callback("error");
          return;
        }

        callback();
      };

      _fs._real_readdir = _fs.readdir;
      _fs.readdir = function(path, callback)
      {
        if (path.indexOf("fail") !== -1)
        {
          callback("error");
          return;
        }

        if (path.indexOf("dir") !== -1)
        {
          callback(null, []);
          return;
        }

        callback(null, [path + "-file1", path + "dir1"]);
      };

      _fs._real_stat = _fs.stat;
      _fs.stat = function(path, callback)
      {
        if (path.indexOf("fail") !== -1)
        {
          callback("error");
          return;
        }

        callback(null, { isFile: function() { return path.indexOf("file") !== -1; } });
      };

      _fs._real_rmdir = _fs.rmdir;
      _fs.rmdir = function(path, callback)
      {
        if (path.indexOf("fail") !== -1)
        {
          callback("error");
          return;
        }

        callback();
      };
    });

    teardown(function()
    {
      _fs.exists = _fs._real_exists;
      _fs.mkdir = _fs._real_mkdir;
      _fs.unlink = _fs._real_unlink;
      _fs.readdir = _fs._real_readdir;
      _fs.rmdir = _fs._real_rmdir;
    });

    suite("mimetypes", function()
    {
      test("Mimetype list should exist", function()
      {
        assert.equal(typeof _file.mimetypes, "object");
      });

      test("Rawimage mimetypes should be and array", function()
      {
        assert.ok(_file.mimetypes["rawimage"]);
        assert.ok(_file.mimetypes["rawimage"] instanceof Array);
      });

      test("Image mimetypes should be and array", function()
      {
        assert.ok(_file.mimetypes["image"]);
        assert.ok(_file.mimetypes["image"] instanceof Array);
      });

      test("Video mimetypes should be and array", function()
      {
        assert.ok(_file.mimetypes["video"]);
        assert.ok(_file.mimetypes["video"] instanceof Array);
      });

      test("Audio mimetypes should be and array", function()
      {
        assert.ok(_file.mimetypes["audio"]);
        assert.ok(_file.mimetypes["audio"] instanceof Array);
      });

      suite("isRawimage", function()
      {
        test("Rawimage mimetypes should report as true from isRawimage", function()
        {
          for (var n = 0; n < _file.mimetypes["rawimage"].length; n++)
          {
            assert.ok(_file.isRawimage(_file.mimetypes["rawimage"][n]));
          }
        });
      });

      suite("isImage", function()
      {
        test("Image mimetypes should report as true from isImage", function()
        {
          for (var n = 0; n < _file.mimetypes["image"].length; n++)
          {
            assert.ok(_file.isImage(_file.mimetypes["image"][n]));
          }
        });
      });

      suite("isVideo", function()
      {
        test("Video mimetypes should report as true from isVideo", function()
        {
          for (var n = 0; n < _file.mimetypes["video"].length; n++)
          {
            assert.ok(_file.isVideo(_file.mimetypes["video"][n]));
          }
        });
      });

      suite("isAudio", function()
      {
        test("Audio mimetypes should report as true from isAudio", function()
        {
          for (var n = 0; n < _file.mimetypes["audio"].length; n++)
          {
            assert.ok(_file.isAudio(_file.mimetypes["audio"][n]));
          }
        });
      });
    });

    suite("createDirectory", function()
    {
      test("Try to create a directory that exists", function(done)
      {
        _file.createDirectory("exists", done);
      });

      test("Try to create a directory that do not exists", function(done)
      {
        _file.createDirectory("noexists", done);
      });

      test("That error is propagated when creation failed", function(done)
      {
        _file.createDirectory("fail", function(error)
        {
          assert.equal("error", error);
          done();
        });
      });
    });

//     suite("copyFile", function()
//     {
//       test("No tests needed for copyFile");
//     });

    suite("remove", function()
    {
      test("Try to remove a file that exists", function(done)
      {
        _file.remove("exists", function(error)
        {
          done(error);
        });
      });

      test("Try to remove a file that do not exists", function(done)
      {
        _file.remove("nofile", function(error)
        {
          done(error);
        });
      });

      test("That error is propagated when removal failed", function(done)
      {
        _file.remove("exists-fail", function(error)
        {
          assert.equal("error", error);
          done();
        });
      });

      test("Try to remove a directory that exists", function(done)
      {
        _file.remove("exists", done);
      });

      test("Try to remove a directory that do not exists", function(done)
      {
        _file.remove("nofile", done);
      });

      test("That error is propagated when remove failed", function(done)
      {
        _file.remove("exists-fail", function(error)
        {
          assert.equal("error", error);
          done();
        });
      });
    });

    suite("md5", function()
    {
      test("Not implemented yet");
    });

    suite("mimetype", function()
    {
      test("Not implemented yet");
    });

    suite("exif", function()
    {
      test("Not implemented yet");
    });
  });
});
