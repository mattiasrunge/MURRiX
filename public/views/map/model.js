
var MapModel = function(parentModel)
{
  var self = this;

  var options = {
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

  self.map = new google.maps.Map($(".background-map").get(0), options);

  self.markers = ko.observableArray();
  self.loading = ko.observable(false);
  self.loaded = ko.observable(false);

  parentModel.nodeModel.node.subscribe(function(value)
  {
    for (var n = 0; n < self.markers().length; n++)
    {
      self.markers()[n].setMap(null);
    }

    self.markers.removeAll();
    self.loaded(false);

    if (value !== false)
    {
      self.load();
    }
  });


  self.load = function()
  {
    if (!self.loaded() && parentModel.nodeModel.node() !== false)
    {
      self.loading(true);

      murrix.server.emit("helper_nodeGetMapMarkers", { nodeId: parentModel.nodeModel.node()._id() }, function(error, markerList)
      {
        self.loading(false);

        if (error)
        {
          console.log(error);
          return;
        }

        console.log("MapModel: Loaded " + markerList.length + " markers!");

        var clickHandler = function()
        {
          document.location.hash += "/:" + this._id;
        };

        for (n = 0; n < markerList.length; n++)
        {
          var marker = new google.maps.Marker({
            position: new google.maps.LatLng(markerList[n].where.latitude, markerList[n].where.longitude),
            map: self.map,
            title: markerList[n].name
          });

          marker._id = markerList[n]._id;

          google.maps.event.addListener(marker, 'click', clickHandler);

          self.markers.push(marker);
        }

        self.loaded(true);

        if (self.markers().length > 0)
        {
          self.map.panTo(self.markers()[0].getPosition());
        }
      });
    }
  };
};
