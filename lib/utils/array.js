
var util = require("util");

exports.in = function(needle, haystack)
{
  for (var n = 0; n < haystack.length; n++)
  {
    if (haystack[n] === needle)
    {
      return true;
    }
  }

  return false;
};

exports.values = function(hash)
{
  var array = [];

  for (var key in hash)
  {
    array.push(hash[key]);
  }

  return array;
};

exports.add = function(item, haystack)
{
  var items = item;

  if (!(item instanceof Array))
  {
    items = [ item ];
  }

  for (var n = 0; n < items.length; n++)
  {
    if (!exports.in(items[n], haystack))
    {
      haystack.push(items[n]);
    }
  }

  return haystack;
};

exports.intersect = function(a, b)
{
  return a.filter(function(item)
  {
    return exports.in(item, b);
  });
};

