
var assert = require("assert");

suite("utils", function()
{
  suite("number", function()
  {
    var _number = require("../number.js");

    suite("float", function()
    {
      test("Conversion of 123.456789", function()
      {
        assert.equal(123.456789, _number.float("123.456789"));
      });

      test("Zero conversion", function()
      {
        assert.equal(0, _number.float("0"));
        assert.equal(0, _number.float("0.0"));
      });

      test("Invalid should return 0", function()
      {
        assert.equal(0, _number.float("invalid"));
      });
    });

    suite("int", function()
    {
      test("123.456789 should give back an integer equal to 123", function()
      {
        assert.equal(123, _number.int("123.456789"));
      });

      test("Zero conversion", function()
      {
        assert.equal(0, _number.int("0"));
        assert.equal(0, _number.int("0.0"));
      });

      test("Invalid should return 0", function()
      {
        assert.equal(0, _number.int("invalid"));
      });
    });

    suite("round", function()
    {
      test("Round 123.456789 to two decimals", function()
      {
        assert.equal(123.46, _number.round(123.456789, 2));
      });
    });

    suite("fractionString", function()
    {
      test("Zero should give zero", function()
      {
        assert.equal("0", _number.fractionString(0));
      });

      test("Larger than zero should return the same value but rounded", function()
      {
        assert.equal("2.12", _number.fractionString(2.123));
      });

      test("Nice fraction string of 0.123 should return 1/8", function()
      {
        assert.equal("1/8", _number.fractionString(0.123));
      });
    });
  });
});
