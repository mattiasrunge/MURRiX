
function DialogComponentPositionModel(dialogModel)
{
  var self = this;

  /* Public observables */
  self.disabled = ko.observable(false); // Disables the whole component, while loading for instance
  self.address = ko.observable("");
  self.value = ko.observable({ latitude: false, longitude: false });


  /* Private stuff */
  var url = "http://maps.googleapis.com/maps/api/geocode/json";

  var options = {
    zoom: 13,
    center: new google.maps.LatLng(57.6706907666667, 11.9375348333333),
    mapTypeId: google.maps.MapTypeId.HYBRID,
    streetViewControl: false,
    panControl: false,
    mapTypeControl: false,
    zoomControl: true,
    zoomControlOptions: {
      style: google.maps.ZoomControlStyle.LARGE,
      position: google.maps.ControlPosition.TOP_LEFT
    },
  };

  self.map = null;
  self.marker = null;
  self.timer = null;
  self.infowindow = new google.maps.InfoWindow();
  self.fullscreen = ko.observable(false);
  self.query = ko.observable("");
  self.results = {};


  self.clearTimer = function()
  {
    if (self.timer)
    {
      clearInterval(self.timer);
      self.timer = null;
    }
  };

  self.initMap = function()
  {
    if (!dialogModel.visible())
    {
      self.clearTimer();
    }

    if ($(".dialogComponentPositionMap").is(":visible"))
    {
      self.clearTimer();
      self.map = new google.maps.Map($(".dialogComponentPositionMap").get(0), options);

      self.marker = new google.maps.Marker({
        position: new google.maps.LatLng(0, 0),
        map: self.map,
        draggable: true,
        visible: false
      });

      google.maps.event.addListener(self.map, "click", function(data)
      {
        if (!self.marker.getVisible())
        {
          self.value({ latitude: data.latLng.lat(), longitude: data.latLng.lng() });
        }
      });

      google.maps.event.addListener(self.marker, "dragend", function(data)
      {
        self.value({ latitude: data.latLng.lat(), longitude: data.latLng.lng() });
      });

      google.maps.event.addListener(self.marker, "click", function()
      {
        self.infowindow.open(self.map, self.marker);
      });
    }
  }

  dialogModel.visible.subscribe(function(value)
  {
    if (value)
    {
      if (!self.timer)
      {
        self.timer = setInterval(function() { self.initMap(); }, 100);
      }
    }
    else
    {
      self.clearTimer();
      self.map = null;
    }
  });

  self.searchSubmit = function()
  {
    var parts = self.query().split(",");

    for (var n = 0; n < parts.length; n++)
    {
      parts[n] = jQuery.trim(parts[n]);
    }

    if (parts.length > 1 && parts[0].length > 0 && parts[1].length > 0)
    {
      var latitude = parseFloat(parts[0]);
      var longitude = parseFloat(parts[1]);

      if (!isNaN(latitude) && !isNaN(longitude))
      {
        self.value({ latitude: latitude, longitude: longitude });
        self.query("");
      }
    }
  };

  self.searchTypeaheadSource = function(query, callback)
  {
    self.results = {};

    jQuery.getJSON(url, { address: query, sensor: false }, function(data)
    {
      if (data.status !== "OK")
      {
        console.log(data.status);
        callback([]);
        return;
      }

      //console.log(data);

      for (var n = 0; n < data.results.length; n++)
      {
        data.results[n].index = n;
        data.results[n].toString = function() { return this.index; };
      }

      self.results = data.results;

      callback(data.results);
    });
  };

  self.searchTypeaheadMatcher = function(item)
  {
    return true;//~item.formatted_address.toLowerCase().indexOf(this.query.toLowerCase());
  };

  self.searchTypeaheadHighlighter = function(item)
  {
    var query = this.query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
    return item.formatted_address.replace(new RegExp('(' + query + ')', 'ig'), function($1, match)
    {
      return "<strong>" + match + "</strong>"
    });
  };

  self.searchTypeaheadUpdater = function(query)
  {
    self.value({ latitude: self.results[query].geometry.location.lat, longitude: self.results[query].geometry.location.lng });
  };

  self.value.subscribe(function(value)
  {
    if (self.marker)
    {
      if (value.latitude === false || value.longitude === false)
      {
        self.marker.setVisible(false);
      }
      else
      {
        var position = new google.maps.LatLng(value.latitude, value.longitude);

        self.marker.setPosition(position);
        self.marker.setVisible(true);
        self.map.panTo(position);

        jQuery.getJSON(url, { latlng: value.latitude + "," + value.longitude, sensor: false }, function(data)
        {
          var content = "";

          if (data.status !== "OK")
          {
            self.address(data.status);
            return;
          }

          if (data.results.length === 0)
          {
            self.address("");
            return;
          }

          self.address(data.results[0].formatted_address);
        });
      }
    }
  });

  self.content = ko.computed(function()
  {
    var content = "";

    if (self.address() !== "")
    {
      content += "<h6 style='margin-bottom: 10px;'>" + self.address() + "</h6>";
    }

    content += "<table class='table table-condensed table-striped' style='font-size: 10px; margin-bottom: 0px;'>";
    content += "<tr>";
    content += "<td>Latitude</td>";
    content += "<td>" + self.value().latitude + "</td>";
    content += "</tr>";
    content += "<tr>";
    content += "<td>Longitude</td>";
    content += "<td>" + self.value().longitude + "</td>";
    content += "</tr>";
    content += "</table>";

    return content;
  });

  self.content.subscribe(function(value)
  {
    self.infowindow.setContent(value);
  });

  self.fullscreenToggle = function()
  {
    self.fullscreen(!self.fullscreen());
    google.maps.event.trigger(self.map, "resize");

    if (self.marker.getVisible())
    {
      self.map.setCenter(self.marker.getPosition());
    }
  };
};
