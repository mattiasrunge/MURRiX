
var assert = require("assert");

suite("utils", function()
{
  suite("crypto", function()
  {
    var _crypto = require("../crypto.js");

    suite("sha1", function()
    {
      test("Hash two strings", function()
      {
        assert.equal("2aae6c35c94fcfb415dbe95f408b9ce91ee846ed", _crypto.sha1("hello world"));
        assert.equal("30c0a5d1de51dd3d5d8909013d35e810d98d17a3", _crypto.sha1("this is a dummy string"));
      });
    });

    suite("generatePassword", function()
    {
      test("Check the length of a generated password", function()
      {
        assert.equal(16, _crypto.generatePassword().length);
      });
    });
  });
});
