
define(['knockout', 'murrix'], function(ko, murrix)
{
  var ctor = function() {};

  ctor.prototype.activate = function(settings)
  {
    var self = this;

    self.users = ko.observableArray();

    murrix.server.emit("user.find", { query: { _groups: settings.groupId } }, function(error, userDataList)
    {
      if (error)
      {
        console.log(error);
        return;
      }

      self.users.removeAll();

      for (var key in userDataList)
      {
        self.users.push(userDataList[key]);
      }
    });
  };

  return ctor;
});
