
var assert = require("assert");

suite("utils", function()
{
  suite("position", function()
  {
    var _position = require("../position.js");

    suite("nmeaDDMMSSToDecimalDegrees", function()
    {
      test("Check that conversion is correct for latitude", function()
      {
        assert.equal(57.670751, _position.nmeaDDMMSSToDecimalDegrees("5740.24506"));
      });

      test("Check that conversion is correct for longitude", function()
      {
        assert.equal(11.937176333333332, _position.nmeaDDMMSSToDecimalDegrees("1156.23058"));
      });
    });

    suite("nmeaParse", function()
    {
      test("Check parsing of GPRMC sentence", function()
      {
        var result = {
          datestring: "2013-07-20 20:49:55",
          valid: true,
          latitude: 57.670751,
          longitude: 11.937177166666666,
          speed: 0,
          bearing:0
        };

        assert.deepEqual(result, _position.nmeaParse("$GPRMC,204955.379,A,5740.24506,N,1156.23063,E,0.000000,0.000000,200713,,*32"));

        var result = {
          datestring: "2013-07-20 20:49:55",
          valid: true,
          latitude: -57.670751,
          longitude: -11.937177166666666,
          speed: 0,
          bearing:0
        };

        assert.deepEqual(result, _position.nmeaParse("$GPRMC,204955.379,A,5740.24506,S,1156.23063,W,0.000000,0.000000,200713,,*32"));
      });
    });
  });
});
