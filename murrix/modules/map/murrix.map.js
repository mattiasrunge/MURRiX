
$(function()
{
  var kMapPathTimeHysteres = 60;
  var kMapCheckTimeout = 1000;

  var MapPath = function(map, color)
  {
    var self = this;

    self.polyline = new google.maps.Polyline({
      path          : new google.maps.MVCArray(),
      strokeColor   : color,
      strokeOpacity : 1,
      strokeWeight  : 2,
      map           : map,
      geodesic      : true
    });

    self.destroy = function()
    {
      self.polyline.setMap(null);
    };

    self.addPosition = function(position)
    {
      var path = self.polyline.getPath();

      var coordinates = position.coordinates;

      coordinates.timestamp = position.timestamp;

      var insertIndex = 0;

      if (path.getLength() > 0)
      {
        for (var index = 0; index < path.getLength(); index++)
        {
          if (path.getAt(index).timestamp > coordinates.timestamp)
          {
            insertIndex = index; // Insert before
            break;
          }
          else
          {
            insertIndex = index + 1; // Insert after
          }
        }
      }

//      console.log(insertIndex, self.polyline.getPath().getLength(), coordinate.timestamp);
      path.insertAt(insertIndex, coordinates);
    };

    self.addPositions = function(positions)
    {
      jQuery.each(positions, function(n, position)
      {
        self.addPosition(position);
      });
    };

    self.inRange = function(position)
    {
      var path = self.polyline.getPath();

      if (path.getLength() == 0)
      {
        return true;
      }

      return (path.getAt(0).timestamp - kMapPathTimeHysteres <= position.timestamp && position.timestamp <= path.getAt(path.getLength() - 1).timestamp + kMapPathTimeHysteres);
    };
  };

  $.murrix.module.map = new function()
  {
    var self = this;

    this.container_ = null;
    this.paths_ = [];
    this.map_ = null;
    this.colors_ = [ "#FF0000", "#00FF00", "#0000FF" ];

    this.lastCreatedPosition = null;
    this.lastDatetimePosition = null
    this.nodes = [];
    this.timer = null;

    this.options_ = {
      zoom: 18,
      center: new google.maps.LatLng(57.6706907666667, 11.9375348333333),
      mapTypeId: google.maps.MapTypeId.HYBRID,

      streetViewControl: false,
      panControl: false,
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: google.maps.ControlPosition.TOP_LEFT
      },
      zoomControl: true,
      zoomControlOptions: {
        style: google.maps.ZoomControlStyle.LARGE,
        position: google.maps.ControlPosition.LEFT_TOP
      },
      scaleControl: true,
      scaleControlOptions: {
        position: google.maps.ControlPosition.LEFT_BOTTOM
      }
    };

    this.show = function(container_name, options)
    {
      this.container_ = $(container_name);

      if (options)
      {
        this.options_ = options;
      }
      
      this.map_ = new google.maps.Map(this.container_.get(0), this.options_);
    };

    /*
    this.constructPath = function(positions, properties)
    {
      var path = {};
      var coordinates = [];

      if (positions.length === 0)
      {
        return false;
      }
      else if (positions.length === 1)
      {
        var title = properties.node.name + "\nTime is " + positions[0].datetime;

        path.endMarker = new google.maps.Marker({
          position  : new google.maps.LatLng(positions[0].latitude, positions[0].longitude),
          title     : title
        });
      }
      else
      {
        jQuery.each(positions, function(n, position)
        {
          coordinates.push(new google.maps.LatLng(position.latitude, position.longitude));
        });

        path.polyline = new google.maps.Polyline({
          path          : coordinates,
          strokeColor   : properties.color,
          strokeOpacity : 1,
          strokeWeight  : 2,
          geodesic      : true
        });

        var title = properties.node.name + "\nPath start time is " + positions[0].datetime + "\nPath end time is " + positions[positions.length - 1].datetime + "\nNumber of coordinates is " + coordinates.length;
        
        google.maps.event.addListener(path.polyline, "click", function(event)
        {
          console.log(title);
        });

        

        path.startMarker = new google.maps.Marker({
          position  : new google.maps.LatLng(positions[0].latitude, positions[0].longitude),
          title     : title + "\nFirst position in path"
        });

        path.endMarker = new google.maps.Marker({
          position  : new google.maps.LatLng(positions[positions.length - 1].latitude, positions[positions.length - 1].longitude),
          title     : title + "\nLast position in path"
        });
      }

      return path;
    };

    this.constructPaths = function(position_list, properties)
    {
      var poslist = [];

      jQuery.each(position_list, function(n, position)
      {
        poslist.push(position);
      });

      position_list = poslist;
    
      position_list.sort(function(a, b)
      {
        return Date.parse(a.datetime) - Date.parse(b.datetime);
      });

    
      var paths = [];
      var path_positions = [];
      var last_timestamp = -2;
      var count = 0;

      jQuery.each(position_list, function(n, position)
      {
        if (parseFloat(position.latitude) === 0 || parseFloat(position.longitude) === 0)
        {
          //console.log(position);
          return true;
        }
        else if (position.datetime === "0000-00-00 00:00:00")
        {
          path_positions.push(position);
          paths.push(self.constructPath(path_positions, properties));
          path_positions = [];

          count++;
          return true;
        }


        timestamp = Date.parse(position.datetime) / 1000;

        // Check if line has ended
        if (path_positions.length > 0 && last_timestamp + 60 < timestamp)
        {
          paths.push(self.constructPath(path_positions, properties));
          path_positions = [];
        }


        // Line has started
        last_timestamp = timestamp;

        path_positions.push(position);

        count++;
      });

      if (path_positions.length > 0)
      {
        paths.push(self.constructPath(path_positions, properties));
        path_positions = [];
      }

      console.log("Number of positions found: " + count);

      return paths;
    };


    this.plotPath = function(path, properties)
    {
      if (path.polyline)
      {
        path.polyline.setMap(self.map_);

        /*google.maps.event.addListener(path.polyline, "click", function(event)
        {
          console.log(event);
        });
      }

      if (path.startMarker)
      {
        path.startMarker.setMap(self.map_);
      }

      path.endMarker.setMap(self.map_);

      google.maps.event.addListener(path.polyline, "click", function(event)
      {
        console.log(event);
      });
    };

    this.plotPaths = function(properties, paths)
    {
      if (paths.length > 0)
      {
        jQuery.each(paths, function(n, path)
        {
          self.plotPath(path, properties);
        });

        self.map_.panTo(paths[paths.length - 1].endMarker.getPosition());
      }
    };*/

    this.clearMap = function()
    {
      self.stopPoll();

      if (self.paths_.length > 0)
      {
        jQuery.each(self.paths_, function(n, path)
        {
          path.destroy();
        });
      }

      self.paths_ = [];
      self.nodes = [];
    };

    this.stopPoll = function()
    {
      if (self.timer)
      {
        clearInterval(self.timer);
      }

      self.timer = null;
    }

    this.startPoll = function()
    {
      self.stopPoll();

      self.timer = setInterval(function() { self.checkForNewPositions(); }, kMapCheckTimeout);
    }

    this.setNodes = function(nodes)
    {
      this.clearMap();

      this.nodes = nodes;

      jQuery.each(nodes, function(n, node)
      {
        $.murrix.module.db.fetchPositions({ node_id_list: [ node.id() ], start_datetime: "2012-07-23", end_datetime: "2012-07-30" }, function(transactionId, resultCode, positionResponse)
        {
          // TODO Check resultCode

          if (positionResponse[node.id()])
          {
            self.handleUpdatedPositionList(node, positionResponse[node.id()]);
          }

          //self.startPoll();
        });
      });
    };

    this.checkForNewPositions = function()
    {
      jQuery.each(self.nodes, function(n, node)
      {
        mainModel.db.fetchPositions({ node_id_list: [ node.id() ], /*start_datetime: "2012-07-26", */start_created: self.lastCreatedPosition.created }, function(transactionId, resultCode, positionResponse)
        {
          // TODO Check resultCode

          if (positionResponse[node.id()])
          {
            self.handleUpdatedPositionList(node, positionResponse[node.id()]);
          }
        });
      });
    };
    
    this.handleUpdatedPositionList = function(node, positionList)
    {
      var colorCounter = 0;
      var positionCounter = 0;
      var pathCounter = 0;

      jQuery.each(positionList, function(n, position)
      {
        if (parseFloat(position.latitude) === 0 || parseFloat(position.longitude) === 0)
        {
          return true;
        }
        else if (position.datetime === "0000-00-00 00:00:00")
        {
          position.timestamp = 0;
        }
        else
        {
          position.timestamp = Date.parse(position.datetime) / 1000;
        }

        position.coordinates = new google.maps.LatLng(position.latitude, position.longitude);
            
        var foundPath = false;

        jQuery.each(self.paths_, function(n, path)
        {
          if (path.inRange(position))
          {
            path.addPosition(position);
            foundPath = true;
            return false;
          }
        });

        if (!foundPath)
        {
          var path = new MapPath(self.map_, self.colors_[colorCounter]);

/*        if (++colorCounter >= self.colors_.length)
          {
            colorCounter = 0;
          }
*/
          path.addPosition(position);

          self.paths_.push(path);
          pathCounter++;
        }

        if (!self.lastDatetimePosition || position.timestamp > self.lastDatetimePosition.timestamp)
        {
          self.lastDatetimePosition = position;
        }

        if (!self.lastCreatedPosition || Date.parse(position.created) > Date.parse(self.lastCreatedPosition.created))
        {
          self.lastCreatedPosition = position;
        }

        positionCounter++;
      });

      console.log("Found " + positionCounter + " positions!");
      console.log("Created " + pathCounter + " paths!");

      self.map_.panTo(self.lastDatetimePosition.coordinates);

/*    if (++colorCounter >= self.colors_.length)
      {
        colorCounter = 0;
      }*/
    }

  }();
});
