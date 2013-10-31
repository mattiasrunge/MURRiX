
var assert = require("assert");

suite("db", function()
{
  var _db = require("../db.js");

  setup(function(done)
  {
    _db.open("localhost", 27017, "unit_tests", done);
  });

  teardown(function(done)
  {
    _db.destroyDatabase("iamsure", done);
  });

  suite("save", function()
  {
    test("Count should be zero for empty collection", function(done)
    {
      _db.count({}, "test", function(error, count)
      {
        if (error)
        {
          done(error);
          return;
        }

        assert.equal(0, count);
        done();
      });
    });

    test("Insert an element and count should be 1", function(done)
    {
      _db.save({}, "test", function(error, doc)
      {
        if (error)
        {
          done(error);
          return;
        }

        _db.count({}, "test", function(error, count)
        {
          if (error)
          {
            done(error);
            return;
          }

          assert.equal(1, count);
          done();
        });
      });
    });
  });

  // TODO
});
