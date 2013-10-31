
var assert = require("assert");

suite("utils", function()
{
  suite("time", function()
  {
    var _time = require("../time.js");

    suite("age", function()
    {
      test("Test common case", function()
      {
        assert.equal(30, _time.age(_time.timestamp("1982-11-25"), _time.timestamp("2013-09-25")));
      });

      test("Test less than a year", function()
      {
        assert.equal(0, _time.age(_time.timestamp("1954-01-24"), _time.timestamp("1954-09-10")));
      });

      test("Test just under a year", function()
      {
        assert.equal(0, _time.age(_time.timestamp("1977-06-08"), _time.timestamp("1978-06-07")));
      });

      test("Test first birthday", function()
      {
        assert.equal(1, _time.age(_time.timestamp("1977-06-08"), _time.timestamp("1978-06-08")));
      });

      test("Test just over a year", function()
      {
        assert.equal(1, _time.age(_time.timestamp("1977-06-08"), _time.timestamp("1978-06-09")));
      });

    });

    suite("isDaylightSavings", function()
    {
      test("Test invalid inputs", function()
      {
        assert.equal(false, _time.isDaylightSavings("XXXX-XX-XX"));
        assert.equal(false, _time.isDaylightSavings("2013-XX-XX"));
        assert.equal(false, _time.isDaylightSavings("2013-01-XX"));
      });

      test("Some sample tests for when it is daylight savings 1987", function()
      {
        assert.equal(true, _time.isDaylightSavings("1987-03-29"));
        assert.equal(true, _time.isDaylightSavings("1987-09-27"));
      });

      test("Some sample tests for when it is daylight savings 1996", function()
      {
        assert.equal(true, _time.isDaylightSavings("1996-03-31"));
        assert.equal(true, _time.isDaylightSavings("1996-10-27"));
      });

      test("Some sample tests for when it is daylight savings 2008", function()
      {
        assert.equal(true, _time.isDaylightSavings("2008-03-30"));
        assert.equal(true, _time.isDaylightSavings("2008-10-26"));
      });

      test("Some sample tests for when it is daylight savings 2013", function()
      {
        assert.equal(true, _time.isDaylightSavings("2013-03-31"));
        assert.equal(true, _time.isDaylightSavings("2013-10-27"));
      });

      test("Some sample tests for when it is daylight savings 2017", function()
      {
        assert.equal(true, _time.isDaylightSavings("2017-03-26"));
        assert.equal(true, _time.isDaylightSavings("2017-10-29"));
      });

      test("Some sample tests for when it is daylight savings 2020", function()
      {
        assert.equal(true, _time.isDaylightSavings("2020-03-29"));
        assert.equal(true, _time.isDaylightSavings("2020-10-25"));
      });

      test("Some sample tests for when it is not daylight savings 1987", function()
      {
        assert.equal(false, _time.isDaylightSavings("1987-03-28"));
        assert.equal(false, _time.isDaylightSavings("1987-09-28"));
      });

      test("Some sample tests for when it is not daylight savings 1996", function()
      {
        assert.equal(false, _time.isDaylightSavings("1996-03-30"));
        assert.equal(false, _time.isDaylightSavings("1996-10-28"));
      });

      test("Some sample tests for when it is not daylight savings 2008", function()
      {
        assert.equal(false, _time.isDaylightSavings("2008-03-29"));
        assert.equal(false, _time.isDaylightSavings("2008-10-28"));
      });

      test("Some sample tests for when it is not daylight savings 2013", function()
      {
        assert.equal(false, _time.isDaylightSavings("2013-03-30"));
        assert.equal(false, _time.isDaylightSavings("2013-10-28"));
      });

      test("Some sample tests for when it is not daylight savings 2017", function()
      {
        assert.equal(false, _time.isDaylightSavings("2017-03-25"));
        assert.equal(false, _time.isDaylightSavings("2017-10-30"));
      });

      test("Some sample tests for when it is not daylight savings 2020", function()
      {
        assert.equal(false, _time.isDaylightSavings("2020-03-28"));
        assert.equal(false, _time.isDaylightSavings("2020-10-26"));
      });
    });

    suite("string", function()
    {
      test("Check that we get back a string and it has a length", function()
      {
        assert.ok(typeof _time.string() === "string");
        assert.ok(_time.string().length > 0);
      });
    });

    suite("timestamp", function()
    {
      test("Convert string to timestamp", function()
      {
        assert.equal(0, _time.timestamp("1970-01-01 00:00:00+00:00"));
        assert.equal(1359285154, _time.timestamp("2013-01-27 12:12:34+01:00"));
      });

      test("No argument", function()
      {
        assert.ok(typeof _time.timestamp() === "number");
      });
    });

    suite("parseTimezone", function()
    {
      test("Test unknown cases", function()
      {
        assert.equal("+00:00", _time.parseTimezone("Unknown"));
        assert.equal("+00:00", _time.parseTimezone());
        assert.equal("+00:00", _time.parseTimezone(false));
      });

      test("Test string (GMT-05:00) Eastern Time (US & Canada)", function()
      {
        assert.equal("-05:00", _time.parseTimezone("(GMT-05:00) Eastern Time (US & Canada)"));
      });

      test("Test string (GMT) Greenwich Mean Time: Dublin, Edinburgh, Lisbon, London", function()
      {
        assert.equal("+00:00", _time.parseTimezone("(GMT) Greenwich Mean Time: Dublin, Edinburgh, Lisbon, London"));
      });

      test("Test string (GMT+05:45) Kathmandu", function()
      {
        assert.equal("+05:45", _time.parseTimezone("(GMT+05:45) Kathmandu"));
      });

      test("Test string (GMT+13:00) Nuku'alofa", function()
      {
        assert.equal("+13:00", _time.parseTimezone("(GMT+13:00) Nuku'alofa"));
      });
    });

    suite("cleanDatestring", function()
    {
      test("Test string 2012:01:04 12:13:14", function()
      {
        assert.equal("2012-01-04 12:13:14", _time.cleanDatestring("2012:01:04 12:13:14"));
      });

      test("Test string 2012-01-04 12:13:14Z", function()
      {
        assert.equal("2012-01-04 12:13:14", _time.cleanDatestring("2012-01-04 12:13:14Z"));
      });
    });

    suite("timezoneToOffset", function()
    {
      test("Test string (GMT-05:00) Eastern Time (US & Canada)", function()
      {
        assert.equal(-(3600 * 5), _time.timezoneToOffset("(GMT-05:00) Eastern Time (US & Canada)"));
      });

      test("Test string (GMT) Greenwich Mean Time: Dublin, Edinburgh, Lisbon, London", function()
      {
        assert.equal(0, _time.timezoneToOffset("(GMT) Greenwich Mean Time: Dublin, Edinburgh, Lisbon, London"));
      });

      test("Test string (GMT+05:45) Kathmandu", function()
      {
        assert.equal(3600 * 5 + 60 * 45, _time.timezoneToOffset("(GMT+05:45) Kathmandu"));
      });

      test("Test string (GMT+13:00) Nuku'alofa", function()
      {
        assert.equal(3600 * 13, _time.timezoneToOffset("(GMT+13:00) Nuku'alofa"));
      });
    });

    suite("parseDatestring", function()
    {
      test("Test string 2010-01-02 03:04:05", function()
      {
        var result = {
          year: "2010",
          month: "01",
          day: "02",
          hour: "03",
          minute: "04",
          second: "05"
        };

        assert.deepEqual(result, _time.parseDatestring("2010-01-02 03:04:05"));
      });
    });
  });
});
