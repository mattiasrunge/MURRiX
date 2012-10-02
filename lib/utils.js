
exports.parseCookieString = function(cookieString)
{
  var cookies = {};

  if (cookieString)
  {
    cookieString.split(';').forEach(function(cookie)
    {
      var parts = cookie.split('=');
      cookies[parts[0].trim()] = (parts[1] || '').trim();
    });
  }

  return cookies;
}
