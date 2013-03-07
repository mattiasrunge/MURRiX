
function MurrixClientManager(murrix)
{
  var self = this;
  
  self.name = "client";
  self.functions = {};
  self.clients = [];

  self.register = function(name, func)
  {
    self.functions[name] = func;

    for (var n = 0; n < self.clients.length; n++)
    {
      self._bindHandlers(self.clients[n], name);
    }
  };

  self.add = function(client)
  {
    murrix.logger.info(self.name, "Client connected");
    self.clients.push(client);

    for (var name in self.functions)
    {
      self._bindHandlers(client, name);
    }

    client.on("disconnect", function()
    {
      murrix.logger.info(self.name, "Client disconnected");
      self.clients.slice(self.clients.indexOf(client), 1);
    });
  };

  self.emit = function(name, args)
  {
    for (var n = 0; n < self.clients.length; n++)
    {
      self.clients[n].emit(name, args);
    }
  };

  self._bindHandlers = function(client, name)
  {
    client.on(name, function(args, callback)
    {
      callback = callback || function() {};
      self.functions[name](client.handshake.session, args, callback);
    });
  };
};

exports.Manager = MurrixClientManager;