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
    console.log("map sub");

    for (var n = 0; n < self.markers.length; n++)
    {
      self.markers[n].setMap(null);
    }

    self.markers = [];

    for (var n = 0; n < value.length; n++)
    {
      if (typeof value[n].where == "object")
      {
        console.log(value[n].name(), value[n].where.latitude(), value[n].where.longitude());
        self.markers.push(new google.maps.Marker({
          position: new google.maps.LatLng(value[n].where.latitude(), value[n].where.longitude()),
          map: self.map,
          title: value[n].name()
        }));
      }
    }
  });


 // Create a JSON data table
  var data = [
    {
      'start': new Date(2010,7,23),
      'content': 'Conversation<br><img src="img/comments-icon.png" style="width:32px; height:32px;">'
    },
    {
      'start': new Date(2010,7,23,23,0,0),
      'content': 'Mail from boss<br><img src="img/mail-icon.png" style="width:32px; height:32px;">'
    },
    {
      'start': new Date(2010,7,24,16,0,0),
      'content': 'Report'
    },
    {
      'start': new Date(2010,7,26),
      'end': new Date(2010,8,2),
      'content': 'Traject A'
    },
    {
      'start': new Date(2010,7,28),
      'content': 'Memo<br><img src="img/notes-edit-icon.png" style="width:48px; height:48px;">'
    },
    {
      'start': new Date(2010,7,29),
      'content': 'Phone call<br><img src="img/Hardware-Mobile-Phone-icon.png" style="width:32px; height:32px;">'
    },
    {
      'start': new Date(2010,7,31),
      'end': new Date(2010,8,3),
      'content': 'Traject B'
    },
    {
      'start': new Date(2010,8,4,12,0,0),
      'content': 'Report<br><img src="img/attachment-icon.png" style="width:32px; height:32px;">'
    }
  ];

  // specify options
  var options = {
    width:    '100%',
    height:   '210px',
    editable: true,   // enable dragging and editing events
    style:    'box'
  };


//    self.timeline = new links.Timeline($(".background-timeline-content").get(0));
// 
// 
// 
//   links.events.addListener(self.timeline, 'rangechanged', function(properties)
//   {
//     console.log('rangechanged ' + properties.start + ' - ' + properties.end);
//   });

  // Draw our timeline with the created data and options
  //self.timeline.draw(data, options);


  
};
/*



        //$.murrix.module.map.show(".background-map", options);
*/



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

      if (path.getLength() === 0)
      {
        return true;
      }

      return (path.getAt(0).timestamp - kMapPathTimeHysteres <= position.timestamp && position.timestamp <= path.getAt(path.getLength() - 1).timestamp + kMapPathTimeHysteres);
    };
  };

  MurrixMap = function()
  {
    var self = this;

    this.container_ = null;
    this.paths_ = [];
    this.map_ = null;
    this.colors_ = [ "#FF0000", "#00FF00", "#0000FF" ];

    this.lastCreatedPosition = null;
    this.lastDatetimePosition = null;
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
    };

    this.startPoll = function()
    {
      self.stopPoll();

      self.timer = setInterval(function() { self.checkForNewPositions(); }, kMapCheckTimeout);
    };

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
    };

  };
});
