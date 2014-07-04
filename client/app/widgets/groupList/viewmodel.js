
define(['knockout', 'murrix'], function(ko, murrix)
{
  var ctor = function() {};

  ctor.prototype.activate = function(settings)
  {
    var self = this;

    self.groups = ko.observableArray();

    murrix.server.emit("group.find", { query: { _id: { $in: settings.idList } } }, function(error, groupDataList)
    {
      if (error)
      {
        console.log(error);
        return;
      }

      self.groups.removeAll();

      for (var key in groupDataList)
      {
        self.groups.push(groupDataList[key]);
      }
    });
  };

  return ctor;
});
