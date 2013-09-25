
var assert = require("assert");

suite("utils", function()
{
  suite("sort", function()
  {
    var _sort = require("../sort.js");

    suite("natcasecmp", function()
    {
      test("Should sort '10abc' after 1abc'", function()
      {
        var unsorted_list = [ "10abc", "1abc" ];
        var sorted_list = [ "1abc", "10abc" ];

        assert.deepEqual(sorted_list, unsorted_list.sort(_sort.natcasecmp));
      });

      test("Should not change the order of ['1abc', 10abc']", function()
      {
        var sorted_list = [ "1abc", "10abc" ];

        assert.deepEqual(sorted_list, sorted_list.sort(_sort.natcasecmp));
      });
    });
  });
});
