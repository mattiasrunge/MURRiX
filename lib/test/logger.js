
var proxyquire = require("proxyquire");
var assert = require("assert");
var utils = require("../utils");

suite("logger", function()
{
  var _utils = {};
  var _Logger = proxyquire("../logger.js", { "./utils": _utils });
  var _logger = new _Logger("test");

  setup(function()
  {
    _utils.time._real_string = _utils.time.string;
    _utils.time.string = function(path, callback)
    {
      return "Mon Sep 30 2013 21:42:52 GMT+0200 (CEST)";
    };
  });

  teardown(function()
  {
    _utils.time.string = _utils.time._real_string;
  });

  suite("info", function()
  {
    test("Check printout", function()
    {
      var stream = new utils.string.bufferedStream(process.stdout);

      stream.start();

      _logger.info("Hello World!");

      assert.equal("Mon Sep 30 2013 21:42:52 GMT+0200 (CEST)  test       INFO   Hello World!\n", stream.get());

      stream.stop();
    });
  });

  suite("error", function()
  {
    test("Check printout", function()
    {
      var stream = new utils.string.bufferedStream(process.stderr);

      stream.start();

      _logger.error("Hello World!");

      assert.equal("Mon Sep 30 2013 21:42:52 GMT+0200 (CEST)  test       ERROR  Hello World!\n", stream.get());

      stream.stop();
    });
  });

  suite("debug", function()
  {
    test("Check printout", function()
    {
      var stream = new utils.string.bufferedStream(process.stdout);

      stream.start();

      _logger.debug("Hello World!");

      assert.equal("Mon Sep 30 2013 21:42:52 GMT+0200 (CEST)  test       DEBUG  Hello World!\n", stream.get());

      stream.stop();
    });
  });
});
