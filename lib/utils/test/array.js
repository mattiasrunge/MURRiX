
var assert = require("assert");

suite("utils", function()
{
  suite("array", function()
  {
    var _array = require("../array.js");

    suite("in", function()
    {
      test("Check that item is in array", function()
      {
        var list = [ "abc", "123" ];

        assert.ok(_array.in("123", list));
        assert.ok(_array.in("abc", list));
      });

      test("Check that item is not in array", function()
      {
        var list = [ "abc", "123" ];

        assert.ok(!_array.in("987", list));
        assert.ok(!_array.in("987", []));
      });
    });

    suite("values", function()
    {
      test("Check that values are returned", function()
      {
        var hash = { a: "abc", b: "123" };

        assert.deepEqual([ "abc", "123" ], _array.values(hash));
      });
    });

    suite("add", function()
    {
      test("Check that value is added", function()
      {
        var list = [ "abc", "123" ];

        assert.deepEqual([ "abc", "123", "qwerty" ], _array.add("qwerty", list));
      });

      test("Check that values are added", function()
      {
        var list = [ "abc", "123" ];

        assert.deepEqual([ "abc", "123", "hello", "world" ], _array.add([ "hello", "world" ], list));
      });
    });

    suite("intersect", function()
    {
      test("Check intersection of arrays", function()
      {
        var list1 = [ "abc", "hello world" ];
        var list2 = [ "hello world", "123" ];

        assert.deepEqual([ "hello world" ], _array.intersect(list1, list2));
        assert.deepEqual([ "hello world" ], _array.intersect(list2, list1));
      });
    });
  });
});
