
var assert = require("assert");

suite("utils", function()
{
  suite("string", function()
  {
    var _string = require("../string.js");

    suite("rpad", function()
    {
      test("Check right padding", function()
      {
        assert.equal("123xxx", _string.rpad("123", "x", 6));
        assert.equal("xxxx", _string.rpad("", "x", 4));
      });

    });

    suite("lpad", function()
    {
      test("Check left padding", function()
      {
        assert.equal("xxx123", _string.lpad("123", "x", 6));
        assert.equal("xxxx", _string.lpad("", "x", 4));
      });
    });

    suite("bufferedStream", function()
    {
      test("Test output is correct", function()
      {
        var stream = new _string.bufferedStream(process.stdout);

        stream.start();

        console.log("Hello World!");

        assert.equal("Hello World!\n", stream.get());

        stream.stop();
      });
    });
  });
});
