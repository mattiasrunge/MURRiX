

exports.nmeaDDMMSSToDecimalDegrees = function(dms)
{
  var ddmmss = parseFloat(dms) / 100.0;
  var degrees = Math.floor(ddmmss);
  var minutesseconds = ((ddmmss - degrees) * 100) / 60.0;

  return degrees + minutesseconds;
};

exports.nmeaParse = function(sentence)
{
  var position = {};
  //gprmc: '$GPRMC,204955.379,A,5740.24506,N,1156.23063,E,0.000000,0.000000,200713,,*32' },
  //gprmc: '$GPRMC,204957.469,A,5740.24506,N,,E,0.000000,0.000000,200713,,*3E' },

  var parts = sentence.split(",");

  if (parts.length > 8 && parts[0] === "$GPRMC")
  {
    position.datestring = "20" + parts[9].substr(4, 2); // Year
    position.datestring += "-";
    position.datestring += parts[9].substr(2, 2); // Month
    position.datestring += "-";
    position.datestring += parts[9].substr(0, 2); // Day
    position.datestring += " ";
    position.datestring += parts[1].substr(0, 2); // Hour
    position.datestring += ":";
    position.datestring += parts[1].substr(2, 2); // Minute
    position.datestring += ":";
    position.datestring += parts[1].substr(4, 2); // Second

    position.valid = parts[2] === "A";

    position.latitude = exports.nmeaDDMMSSToDecimalDegrees(parts[3]);

    if (parts[4] == "S")
    {
      position.latitude = -position.latitude;
    }

    position.longitude = exports.nmeaDDMMSSToDecimalDegrees(parts[5]);

    if (parts[6] == "W")
    {
      position.longitude = -position.longitude;
    }

    position.speed = parseFloat(parts[7]) * 1.852;
    position.bearing = parseFloat(parts[8]);

    return position;
  }

  return false;
};
