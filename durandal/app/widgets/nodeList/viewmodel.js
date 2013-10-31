
define(['durandal/composition', 'jquery', 'knockout'], function(composition, $, ko)
{
  var ctor = function() {};

  ctor.prototype.activate = function(settings)
  {
    var self = this;

    self.list = settings.list;
    self.id = new Date().getTime();

    self.listAlbum = ko.computed(function()
    {
      return ko.utils.arrayFilter(self.list(), function(result)
      {
        return result.type === 'album';
      });
    });

    self.listPerson = ko.computed(function()
    {
      return ko.utils.arrayFilter(self.list(), function(result)
      {
        return result.type === 'person';
      });
    });

    self.listLocation = ko.computed(function()
    {
      return ko.utils.arrayFilter(self.list(), function(result)
      {
        return result.type === 'location';
      });
    });

    self.listCamera = ko.computed(function()
    {
      return ko.utils.arrayFilter(self.list(), function(result)
      {
        return result.type === 'camera';
      });
    });

    self.listVehicle = ko.computed(function()
    {
      return ko.utils.arrayFilter(self.list(), function(result)
      {
        return result.type === 'vehicle';
      });
    });
  };

  return ctor;
});
