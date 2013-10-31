
exports.float = function(value)
{
  var floatvalue = value;

  if (typeof value !== "number")
  {
    try
    {
      floatvalue = parseFloat(value);
    }
    catch (e)
    {
    }
  }

  if (typeof floatvalue !== "number" || isNaN(floatvalue))
  {
    return 0;
  }

  return floatvalue;
};

exports.int = function(value)
{
  var intvalue = value;

  if (typeof value !== "number")
  {
    try
    {
      intvalue = parseInt(value, 10);
    }
    catch (e)
    {
    }
  }

  if (typeof intvalue !== "number" || isNaN(intvalue))
  {
    return 0;
  }

  return intvalue;
};

exports.round = function(value, precision)
{
  return Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
};

exports.fractionString = function(num)
{
  num = exports.float(num);

  if (num === 0)
  {
    return "0";
  }

  if (num > 1)
  {
    return exports.round(num, 2) + "";
  }

  return "1/" + Math.round(1/num);
};
