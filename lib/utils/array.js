
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

exports.merge = function(hash1, hash2)
{
  var hash = {};
  
  for (var k in hash1)
  {
    hash[k] = hash1[k];
  }
  
  for (var k in hash2)
  {
    hash[k] = hash2[k];
  }
  
  return hash;
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

exports.remove = function(item, haystack)
{
  var items = item;

  if (!(item instanceof Array))
  {
    items = [ item ];
  }

  return haystack.filter(function(element)
  {
    return !exports.in(element, items);
  });
};

exports.intersect = function(a, b)
{
  return a.filter(function(item)
  {
    return exports.in(item, b);
  });
};

exports.createHash = function(list, attr)
{
  var hash = {};

  for (var n = 0; n < list.length; n++)
  {
    hash[list[n][attr]] = list[n];
  }

  return hash;
};

exports.clone = function(obj)
{
  return util._extend({}, obj);
};
