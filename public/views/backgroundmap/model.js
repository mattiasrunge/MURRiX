
var MapTrack = function()
{


};

var BackgroundMapModel = function(parentModel)
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

  self.trackIndex = {};
  self.tracksTimeout = null;
  self.lastTrackTimestamp = false;//moment.utc().unix() - 3600 * 24;//Math.floor(new Date().getTime() / 1000);
  self.markers = ko.observableArray();
  self.trackMarkers = ko.observableArray();
  self.tracks = ko.observableArray();
  self.loading = ko.observable(false);
  self.loaded = ko.observable(false);
  self.colors = [ "red", "yellow", "white", "green", "blue" ];

  parentModel.nodeModel.node.subscribe(function(value)
  {
    for (var n = 0; n < self.markers().length; n++)
    {
      self.markers()[n].setMap(null);
    }

    for (var n = 0; n < self.trackMarkers().length; n++)
    {
      self.trackMarkers()[n].setMap(null);
    }

    for (var n = 0; n < self.tracks().length; n++)
    {
      self.tracks()[n].setMap(null);
    }

    self.tracks.removeAll();
    self.trackMarkers.removeAll();
    self.markers.removeAll();
    self.lastTrackTimestamp = false;//moment.utc().unix() - 3600;
    self.trackIndex = {};
    self.loaded(false);

    if (self.tracksTimeout)
    {
      clearInterval(self.tracksTimeout);
      self.tracksTimeout = null;
    }

    if (value !== false)
    {
      self.load();

//       self.tracksTimeout = setInterval(function()
//       {
//         self.loadTracks();
//       }, 5000);
//
//       self.loadTracks();
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
          document.location.hash += ":" + this._id;
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

  self.loadTracks = function()
  {
    if (parentModel.nodeModel.node() !== false)
    {
      var args = { nodeId: parentModel.nodeModel.node()._id(), limit: 3000 };

      if (self.lastTrackTimestamp)
      {
        args.lastTimestamp = self.lastTrackTimestamp;
      }

      murrix.server.emit("helper_nodeGetMapTracks", args, function(error, positionList)
      {
        if (error)
        {
          console.log(error);
          return;
        }

        console.log("MapModel: Loaded " + positionList.length + " positions!");



        var polyOptions = {
          strokeOpacity: 1.0,
          strokeWeight: 1
        };

        var image = new google.maps.MarkerImage("img/arrow.png",
          new google.maps.Size(23, 34),
          new google.maps.Point(0,0),
          new google.maps.Point(12, 34)
        );


        var markerOptions = {
          icon: image
        };



        var lastLatLong = null;

        //console.log("first", positionList[0].when.timestamp);
        //console.log("last", positionList[positionList.length -1 ].when.timestamp);

        for (n = 0; n < positionList.length; n++)
        {
          if (typeof self.trackIndex[positionList[n]._with] === "undefined")
          {
            self.trackIndex[positionList[n]._with] = {};

            self.trackIndex[positionList[n]._with].index = self.tracks().length;
            self.trackIndex[positionList[n]._with]._with = positionList[n]._with;

            polyOptions.strokeColor = self.colors[self.tracks().length];
            polyOptions.map = self.map;

            var polyline = new google.maps.Polyline(polyOptions);
            self.tracks.push(polyline);


            markerOptions.map = self.map;

            var marker = new google.maps.Marker(markerOptions);

            marker._with = ko.observable(positionList[n]._with);
            marker.color = ko.observable(polyOptions.strokeColor);
            marker.ownerName = ko.observable("unkown");
            marker.deviceName = ko.observable("unknown");
            marker.lastTimestamp = ko.observable(positionList[n].when.timestamp);
            marker.setAnimation(google.maps.Animation.BOUNCE);


            var getTrackInfo = function(mark)
            {
              murrix.server.emit("helper_nodeGetMapTrackedInfo", { _id: mark._with() }, function(error, trackInfo)
              {
                if (error)
                {
                  console.log(error);
                  return;
                }

                mark.ownerName(trackInfo.ownerName);
                mark.deviceName(trackInfo.deviceName);
              });
            };

            getTrackInfo(marker);

            self.trackMarkers.push(marker);

            var clickHandler = function()
            {
              console.log(this._with);
            };

            google.maps.event.addListener(marker, 'click', clickHandler);
          }

          var path =  self.tracks()[self.trackIndex[positionList[n]._with].index].getPath();

          lastLatLong = new google.maps.LatLng(positionList[n].where.latitude, positionList[n].where.longitude);

          path.push(lastLatLong);
          //console.log(path.length);

          self.trackMarkers()[self.trackIndex[positionList[n]._with].index].setPosition(lastLatLong);
          self.trackMarkers()[self.trackIndex[positionList[n]._with].index].lastTimestamp(positionList[n].when.timestamp);
          self.lastTrackTimestamp = positionList[n].when.timestamp;
        }

        if (lastLatLong)
        {
          //self.map.panTo(lastLatLong);

//           for (var _with in self.trackIndex)
//           {
//             self.trackMarkers()[self.trackIndex[_with].index].lastTimestamp.valueHasMutated();
//           }
        }
      });
    }
  };

  self.trackClicked = function()
  {
    self.map.panTo(this.getPosition());
  };
};
