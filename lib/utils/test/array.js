
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

    suite("remove", function()
    {
      test("Check that value is removed", function()
      {
        var list = [ "abc", "123", "qwerty" ];

        assert.deepEqual([ "abc", "123" ], _array.remove("qwerty", list));
      });

      test("Check that values are removed", function()
      {
        var list = [ "abc", "123", "hello", "world" ];

        assert.deepEqual([ "abc", "123" ], _array.remove([ "hello", "world" ], list));
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

    suite("createHash", function()
    {
      test("Create a hash from an array of objects", function()
      {
        var list = [ { _id: "abc", a: "b"}, { _id: "123", b: "a" } ];
        var hash = { "abc": list[0], "123": list[1] };

        assert.deepEqual(hash, _array.createHash(list, "_id"));
      });
    });

    suite("clone", function()
    {
      test("Check object deep cloning", function()
      {
        var object = { a: 1, b: 2 };
        var cloned_object = _array.clone(object);

        assert.notEqual(object, cloned_object);

        cloned_object.b = 3;

        assert.equal(1, object.a);
        assert.equal(2, object.b);
        assert.equal(1, cloned_object.a);
        assert.equal(3, cloned_object.b);
      });
    });
  });
});
