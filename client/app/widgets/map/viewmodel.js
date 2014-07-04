
define(['durandal/composition', 'knockout', 'jquery'], function(composition, ko, $)
{
  var ctor = function() {};

  ctor.prototype.activate = function(settings)
  {
    var self = this;

    self.map = false;
    self.settings = settings;
    self.options = {
      zoom: 10,
      center: new google.maps.LatLng(57.6706907666667, 11.9375348333333),
      mapTypeId: google.maps.MapTypeId.HYBRID,

      streetViewControl: false,
      panControl: false,
      mapTypeControl: false,
      zoomControl: true,
      zoomControlOptions: {
        style: google.maps.ZoomControlStyle.DEFAULT,
        position: google.maps.ControlPosition.RIGHT_TOP
      },
      scaleControl: true,
      scaleControlOptions: {
        position: google.maps.ControlPosition.RIGHT_BOTTOM
      }
    };
  };

  ctor.prototype.compositionComplete = function(view, parent)
  {
    var self = this;

    self.map = new google.maps.Map($(view).children().get(0), self.options);
  };

  return ctor;
});
