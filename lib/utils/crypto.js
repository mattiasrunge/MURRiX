
var crypto = require("crypto");

exports.sha1 = function(str)
{
  return crypto.createHash("sha1").update(str).digest("hex")
};

exports.generatePassword = function()
{
  var character_list = "123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_!";
  var password = "";

  for (var n = 0; n < 16; n++)
  {
    password += character_list.charAt(Math.floor(character_list.length * Math.random()));
  }

  return password;
};
