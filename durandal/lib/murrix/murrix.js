
define(['knockout'], function(ko)
{
  var server = io.connect();
  var user = ko.observable(false);
  var userNode = ko.computed(function()
  {
    if (user() === false)
    {
      return false;
    }

    return false; // TODO
  });

  server.socket.on("error", function(error)
  {
    console.error("Unable to connect Socket.IO, reason: " + error);
  });

  server.on("connect", function()
  {
    console.info("Successfully established a working connection to server");
  });

  server.on("user.event.current", function(userData)
  {
    console.log("Current user is:" , userData);
    user(userData);
  });

  return {
    server: server,
    user: user,
    userNode: userNode
  };
});
