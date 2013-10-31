
// TODO: Maybe replace with https://github.com/jprichardson/string.js

exports.rpad = function(str, char, len)
{
  while (str.length < len)
  {
    str += char;
  }

  return str;
};

exports.lpad = function(str, char, len)
{
  while (str.length < len)
  {
    str = char + str;
  }

  return str;
};

exports.bufferedStream = function(stream)
{
  var self = this;

  self.buffer = "";
  self.original = stream.write;

  self.start = function()
  {
    stream.write = function(chunk, encoding, callback)
    {
      self.buffer += chunk.toString();
    };
  };

  self.stop = function()
  {
    self.clear();
    stream.write = self.original;
  };

  self.get = function()
  {
    return self.buffer;
  };

  self.clear = function()
  {
    self.buffer = "";
  };
};
