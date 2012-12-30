var MapModel = function(parentModel)
{
  var self = this;

  var options = {
    zoom: 13,
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

  self.map = new google.maps.Map($(".background-map").get(0), options);

  self.markers = [];

  parentModel.nodeModel.items.subscribe(function(value)
  {
    for (var n = 0; n < self.markers.length; n++)
    {
      self.markers[n].setMap(null);
    }

    self.markers = [];

    for (n = 0; n < value.length; n++)
    {
      if (value[n].where && value[n].where.source && value[n].where.source() !== false)
      {
        console.log("marker", value[n].name(), value[n].where);
        var marker = new google.maps.Marker({
          position: new google.maps.LatLng(value[n].where.latitude(), value[n].where.longitude()),
          map: self.map,
          title: value[n].name()
        });

        marker._id = value[n]._id();

        google.maps.event.addListener(marker, 'click', function()
        {
          document.location.hash += "/:" + this._id;
        });

        self.markers.push(marker);
      }
    }
  });
};
