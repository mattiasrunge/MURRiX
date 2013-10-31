
exports.timezones = [
  "Unknown",
  "(GMT-12:00) International Date Line West",
  "(GMT-11:00) Midway Island, Samoa",
  "(GMT-10:00) Hawaii",
  "(GMT-09:00) Alaska",
  "(GMT-08:00) Pacific Time (US & Canada); Tijuana",
  "(GMT-07:00) Arizona",
  "(GMT-07:00) Chihuahua, La Paz, Mazatlan",
  "(GMT-07:00) Mountain Time (US & Canada)",
  "(GMT-06:00) Central America",
  "(GMT-06:00) Central Time (US & Canada)",
  "(GMT-06:00) Guadalajara, Mexico City, Monterrey",
  "(GMT-06:00) Saskatchewan",
  "(GMT-05:00) Bogota, Lima, Quito",
  "(GMT-05:00) Eastern Time (US & Canada)",
  "(GMT-05:00) Indiana (East)",
  "(GMT-04:00) Atlantic Time (Canada)",
  "(GMT-04:00) Caracas, La Paz",
  "(GMT-04:00) Santiago",
  "(GMT-03:30) Newfoundland",
  "(GMT-03:00) Brasilia",
  "(GMT-03:00) Buenos Aires, Georgetown",
  "(GMT-03:00) Greenland",
  "(GMT-02:00) Mid-Atlantic",
  "(GMT-01:00) Azores",
  "(GMT-01:00) Cape Verde Is.",
  "(GMT) Casablanca, Monrovia",
  "(GMT) Greenwich Mean Time: Dublin, Edinburgh, Lisbon, London",
  "(GMT+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna",
  "(GMT+01:00) Belgrade, Bratislava, Budapest, Ljubljana, Prague",
  "(GMT+01:00) Brussels, Copenhagen, Madrid, Paris",
  "(GMT+01:00) Sarajevo, Skopje, Warsaw, Zagreb",
  "(GMT+01:00) West Central Africa",
  "(GMT+02:00) Athens, Beirut, Istanbul, Minsk",
  "(GMT+02:00) Bucharest",
  "(GMT+02:00) Cairo",
  "(GMT+02:00) Harare, Pretoria",
  "(GMT+02:00) Helsinki, Kyiv, Riga, Sofia, Tallinn, Vilnius",
  "(GMT+02:00) Jerusalem",
  "(GMT+03:00) Baghdad",
  "(GMT+03:00) Kuwait, Riyadh",
  "(GMT+03:00) Moscow, St. Petersburg, Volgograd",
  "(GMT+03:00) Nairobi",
  "(GMT+03:30) Tehran",
  "(GMT+04:00) Abu Dhabi, Muscat",
  "(GMT+04:00) Baku, Tbilisi, Yerevan",
  "(GMT+04:30) Kabul",
  "(GMT+05:00) Ekaterinburg",
  "(GMT+05:00) Islamabad, Karachi, Tashkent",
  "(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi",
  "(GMT+05:45) Kathmandu",
  "(GMT+06:00) Almaty, Novosibirsk",
  "(GMT+06:00) Astana, Dhaka",
  "(GMT+06:00) Sri Jayawardenepura",
  "(GMT+06:30) Rangoon",
  "(GMT+07:00) Bangkok, Hanoi, Jakarta",
  "(GMT+07:00) Krasnoyarsk",
  "(GMT+08:00) Beijing, Chongqing, Hong Kong, Urumqi",
  "(GMT+08:00) Irkutsk, Ulaan Bataar",
  "(GMT+08:00) Kuala Lumpur, Singapore",
  "(GMT+08:00) Perth",
  "(GMT+08:00) Taipei",
  "(GMT+09:00) Osaka, Sapporo, Tokyo",
  "(GMT+09:00) Seoul",
  "(GMT+09:00) Vakutsk",
  "(GMT+09:30) Adelaide",
  "(GMT+09:30) Darwin",
  "(GMT+10:00) Brisbane",
  "(GMT+10:00) Canberra, Melbourne, Sydney",
  "(GMT+10:00) Guam, Port Moresby",
  "(GMT+10:00) Hobart",
  "(GMT+10:00) Vladivostok",
  "(GMT+11:00) Magadan, Solomon Is., New Caledonia",
  "(GMT+12:00) Auckland, Wellington",
  "(GMT+12:00) Fiji, Kamchatka, Marshall Is.",
  "(GMT+13:00) Nuku'alofa"
];

exports.age = function(start_timestamp, end_timestamp)
{
  var start = new Date();
  var end = new Date();

  start.setTime(start_timestamp * 1000);

  if (end_timestamp)
  {
    end.setTime(end_timestamp * 1000);
  }

  var age = end.getFullYear() - start.getFullYear();
  var m = end.getMonth() - start.getMonth();

  if (m < 0 || (m === 0 && end.getDate() < start.getDate()))
  {
    age--;
  }

  return age;
};

exports.isDaylightSavings = function(datestring)
{
  var parts = datestring.split(" ");
  var check = parts[0];

  parts = check.split("-");

  if (parts[0] === "XXXX" || parts[1] === "XX" || parts[2] === "XX")
  {
    return false;
  }

  var ranges = [];

  ranges.push({ start: "1980-04-06", end: "1980-09-28" });
  ranges.push({ start: "1981-03-29", end: "1981-09-27" });
  ranges.push({ start: "1982-03-28", end: "1982-09-26" });
  ranges.push({ start: "1983-03-27", end: "1983-09-25" });
  ranges.push({ start: "1984-03-25", end: "1984-09-30" });
  ranges.push({ start: "1985-03-31", end: "1985-09-29" });
  ranges.push({ start: "1986-03-30", end: "1986-09-28" });
  ranges.push({ start: "1987-03-29", end: "1987-09-27" });
  ranges.push({ start: "1988-03-27", end: "1988-09-25" });
  ranges.push({ start: "1989-03-26", end: "1989-09-24" });
  ranges.push({ start: "1990-03-25", end: "1990-09-30" });
  ranges.push({ start: "1991-03-31", end: "1991-09-29" });
  ranges.push({ start: "1992-03-29", end: "1992-09-27" });
  ranges.push({ start: "1993-03-28", end: "1993-09-26" });
  ranges.push({ start: "1994-03-27", end: "1994-09-25" });
  ranges.push({ start: "1995-03-26", end: "1995-09-24" });
  ranges.push({ start: "1996-03-31", end: "1996-10-27" });
  ranges.push({ start: "1997-03-30", end: "1997-10-26" });
  ranges.push({ start: "1998-03-29", end: "1998-10-25" });
  ranges.push({ start: "1999-03-28", end: "1999-10-31" });
  ranges.push({ start: "2000-03-26", end: "2000-10-29" });
  ranges.push({ start: "2001-03-25", end: "2001-10-28" });
  ranges.push({ start: "2002-03-31", end: "2002-10-27" });
  ranges.push({ start: "2003-03-30", end: "2003-10-26" });
  ranges.push({ start: "2004-03-28", end: "2004-10-31" });
  ranges.push({ start: "2005-03-27", end: "2005-10-30" });
  ranges.push({ start: "2006-03-26", end: "2006-10-29" });
  ranges.push({ start: "2007-03-25", end: "2007-10-28" });
  ranges.push({ start: "2008-03-30", end: "2008-10-26" });
  ranges.push({ start: "2009-03-29", end: "2009-10-25" });
  ranges.push({ start: "2010-03-28", end: "2010-10-31" });
  ranges.push({ start: "2011-03-27", end: "2011-10-30" });
  ranges.push({ start: "2012-03-25", end: "2012-10-28" });
  ranges.push({ start: "2013-03-31", end: "2013-10-27" });
  ranges.push({ start: "2014-03-30", end: "2014-10-26" });
  ranges.push({ start: "2015-03-29", end: "2015-10-25" });
  ranges.push({ start: "2016-03-27", end: "2016-10-30" });
  ranges.push({ start: "2017-03-26", end: "2017-10-29" });
  ranges.push({ start: "2018-03-25", end: "2018-10-28" });
  ranges.push({ start: "2019-03-31", end: "2019-10-27" });
  ranges.push({ start: "2020-03-29", end: "2020-10-25" });

  for (var n = 0; n < ranges.length; n++)
  {
    check = new Date(check);
    var start = new Date(ranges[n].start);
    var end = new Date(ranges[n].end);

    if (check <= end && check >= start)
    {
      return true;
    }
  }

  return false;
};

exports.string = function(value)
{
  var now = value ? new Date(value) : new Date();
  return now.toString();
};

exports.timestamp = function(value)
{
  var now = value ? new Date(value) : new Date();
  return Math.floor(now.getTime() / 1000);
};

exports.parseTimezone = function(string)
{
  if (!string || string === false || string === "Unknown")
  {
    return "+00:00";
  }

  var timezone = string.match(/\(GMT(.*?)\)/)[1];

  if (timezone === "")
  {
    return "+00:00";
  }

  return timezone;
};

exports.cleanDatestring = function(datestring)
{
  if (datestring[datestring.length - 1] === "Z")
  {
    datestring = datestring.substr(0, datestring.length - 1); // Remove trailing Z
  }

  // Replace dividing : with -
  var parts = datestring.split(" ");
  datestring = parts[0].replace(/:/g, "-") + " " + parts[1];

  return datestring;
};

exports.timezoneToOffset = function(timezone)
{
  var string = exports.parseTimezone(timezone);
  var minus = string[0] === "-";
  var hour = parseInt(string.substr(1, 2), 10);
  var minutes = parseInt(string.substr(4, 2), 10);
  var offset = hour * 3600 + minutes * 60;

  return minus ? -offset : offset;
};

exports.parseDatestring = function(datestring)
{
  var parts = datestring.split(" ");
  var date_parts = parts[0].split("-");
  var time_parts = parts[1].split(":");

  var info = {};

  info.year = date_parts[0];
  info.month = date_parts[1];
  info.day = date_parts[2];
  info.hour = time_parts[0];
  info.minute = time_parts[1];
  info.second = time_parts[2];

  return info;
};

