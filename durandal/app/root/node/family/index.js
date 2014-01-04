
define(['ko-ext', 'murrix'], function(ko, murrix)
{
  var person = ko.observable(false);
  var loading = ko.observable(false);
  var errorText = ko.observable(false);
  var zoom = ko.observable(1);
  
  var dragging = false;
  var canvasElement = false;
  var markDragging = false;
  var markElement = false;
  var meOffset = { top: 0, left: 0 };
  var canvasSize = { width: 0, height: 0 };
  var loaded = false;
  
  murrix.node.subscribe(function()
  {
    loaded = false;
    person(false);
  });
  
  return {
    person: person,
    loading: loading,
    errorText: errorText,
    zoom: zoom,
    startDragHandler: function(data, event)
    {
      dragging = { top: event.clientY, left: event.clientX };
      canvasElement = $("#relation-canvas");
    },
    dragHandler: function(data, event)
    {
      event.preventDefault();
      event.stopPropagation();

      if (dragging)
      {
        var diffTop = event.clientY - dragging.top;
        var diffLeft = event.clientX - dragging.left;

        var position = canvasElement.position();

        canvasElement.css("top", position.top + diffTop);
        canvasElement.css("left", position.left + diffLeft);

        dragging = { top: event.clientY, left: event.clientX };
        this._storePosition();
      }
      else if (markDragging)
      {
        var top = event.clientY - markElement.offset().top;

        this.setZoomByPosition(top, true);
      }
    },
    stopDragHandler: function(data, event)
    {
      event.preventDefault();
      event.stopPropagation();

      if (dragging)
      {
        dragging = false;
        canvasElement = false;
      }

      if (markDragging)
      {
        var top = event.clientY - markElement.offset().top;

        this.setZoomByPosition(top);

        markDragging = false;
      }
    },
    round: function(value, precision)
    {
      return Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
    },
    scrollHandler: function(data, event)
    {
      var wheelData = event.detail ? event.detail * -1 : event.wheelDelta / 40;

      wheelData /= 50;

      event.preventDefault();
      event.stopPropagation();

      this.zoomSet(this.round(zoom() + wheelData, 1));
    },
    zoomSet: function(value, noanimation)
    {
      value = value < 0.2 ? 0.2 : value;
      value = value > 1.6 ? 1.6 : value;

      zoom(value);
      this._adjustCanvasPosition();

      var markElement = $(".mark-container .mark");

      var containerHeight = $(".mark-container").innerHeight();
      var markHeight = markElement.outerHeight();

      containerHeight -= markHeight;
      value -= 0.1;

      var step = containerHeight / 14;
      var top = (containerHeight - step * ((value - 0.1) * 10));

      markElement.stop();

      if (noanimation)
      {
        markElement.css("top", top);
      }
      else
      {
        markElement.animate({ top: top }, 50);
      }
    },
    zoomInc: function()
    {
      this.zoomSet(zoom() + 0.1);
    },
    zoomDec: function()
    {
      this.zoomSet(zoom() - 0.1);
    },
    markContainerClickHandler: function(data, event)
    {
      event.preventDefault();
      event.stopPropagation();

      if (event.srcElement !== $(".mark-container")[0])
      {
        return;
      }

      this.setZoomByPosition(event.offsetY);
    },
    setZoomByPosition: function(top, noanimation)
    {
      var containerHeight = $(".mark-container").innerHeight();
      var markHeight = $(".mark-container .mark").outerHeight();

      top -= markHeight;
      containerHeight -= markHeight;

      var step = containerHeight / 14;

      this.zoomSet(this.round((containerHeight - top) / (step * 10), 1) + 0.1, noanimation);
    },
    startDragMarkHandler: function(data, event)
    {
      event.preventDefault();
      event.stopPropagation();

      markElement = $(".mark-container");
      markDragging = true;
    },
    _storePosition: function()
    {
      var canvasElement = $("#relation-canvas");
      var meElement = $(".relation-me");

      meOffset = meElement.offset();
      canvasSize = { width: canvasElement.width(), height: canvasElement.height() };
    },
    _adjustCanvasPosition: function()
    {
      var canvasElement = $("#relation-canvas");

      if (canvasElement.is(":visible"))
      {
        var size = { width: canvasElement.width(), height: canvasElement.height() };

        var diffHeight = (canvasSize.height - size.height) / 2;
        var diffWidth = (canvasSize.width - size.width) / 2;

        var position = canvasElement.position();

        canvasElement.css("top", position.top + diffHeight);
        canvasElement.css("left", position.left + diffWidth);

        this._storePosition();
      }
    },
    _adjustPosition: function()
    {
      var canvasElement = $("#relation-canvas");

      if (canvasElement.is(":visible"))
      {
        var meElement = $(".relation-me");
        var offset = meElement.offset();

        var diffTop = meOffset.top - offset.top;
        var diffLeft = meOffset.left - offset.left;

        var position = canvasElement.position();

        canvasElement.css("top", position.top + diffTop);
        canvasElement.css("left", position.left + diffLeft);

        this._storePosition();
      }
    },
    _center: function()
    {
      var meElement = $(".relation-me");

      if (meElement.length === 0 || meElement.width() === 0)
      {
        setTimeout(function()
        {
          this._center();
        }.bind(this), 100);
      }
      
      var canvasElement = $("#relation-canvas");
      var $window = $(window);
    
      var position = meElement.position();

      position.left -= ($window.width() - meElement.width()) / 2;
      position.top -= ($window.height() - meElement.height()) / 2;

      canvasElement.css("top", -position.top);
      canvasElement.css("left", -position.left);

      this._storePosition();
    },
    createPerson: function(parentNodeData, nodeData, type, index, count)
    {
      nodeData.tree = {};
      nodeData.tree.parentsVisible = ko.observable(false);
      nodeData.tree.childrenVisible = ko.observable(false);
      nodeData.tree.first = index === 0;
      nodeData.tree.last = index === count - 1;
      nodeData.tree.type = type;
      nodeData.tree.parentsLoading = ko.observable(false);
      nodeData.tree.childrenLoading = ko.observable(false);
      nodeData.tree.parentsLoaded = false;
      nodeData.tree.childrenLoaded = false;
      nodeData.tree.parents = ko.observableArray();
      nodeData.tree.children = ko.observableArray();
      
      nodeData.tree.expandParents = function()
      {
        nodeData.tree.parentsVisible(!nodeData.tree.parentsVisible());
        this._adjustPosition();
      }.bind(this);

      nodeData.tree.expandChildren = function()
      {
        nodeData.tree.childrenVisible(!nodeData.tree.childrenVisible());
        this._adjustPosition();
      }.bind(this);
      
      
      nodeData.tree.loadParents = function()
      {
        if (!nodeData.tree.parents.loaded)
        {
          nodeData.tree.parents.loaded = true;
          nodeData.tree.parentsLoading(true);
          
          murrix.server.emit("node.find", { query: { _id: { $in: nodeData.family.parents.map(function(element) { return element._id; }) } }, age: true }, function(error, nodeDataList)
          {
            nodeData.tree.parentsLoading(false);
            
            if (error)
            {
              console.log(error);
              return;
            }
            
            nodeDataList.sort(function(a, b)
            {
              if (a.gender === b.gender)
              {
                return 0;
              }
              else if (a.gender === "m")
              {
                return 1;
              }
              else if (a.gender === "f")
              {
                return -1;
              }

              return 0;
            });
            
            for (var n = 0; n < nodeDataList.length; n++)
            {
              nodeData.tree.parents.push(this.createPerson(nodeData, nodeDataList[n], "parent", n, nodeDataList.length));
            }
            
            this._adjustPosition();
            
          }.bind(this));
        }
      }.bind(this);
      
      nodeData.tree.loadChildren = function()
      {
        if (!nodeData.tree.children.loaded)
        {
          nodeData.tree.children.loaded = true;
          nodeData.tree.childrenLoading(true);

          murrix.server.emit("node.find", { query: { "family.parents._id": nodeData._id }, age: true }, function(error, nodeDataList)
          {
            nodeData.tree.childrenLoading(false);
            
            if (error)
            {
              console.log(error);
              return;
            }

            nodeDataList.sort(function(a, b)
            {
              if (a.ageInfo.birthTimestamp === b.ageInfo.deathTimestamp)
              {
                return 0;
              }
              else if (!a.ageInfo.birthTimestamp)
              {
                return -1;
              }
              else if (!b.ageInfo.birthTimestamp)
              {
                return 1;
              }
              
              var offset = Math.abs(Math.min(a.ageInfo.birthTimestamp, b.ageInfo.birthTimestamp));
              return (offset + a.ageInfo.birthTimestamp) - (offset + b.ageInfo.birthTimestamp);
            });
            
            for (var n = 0; n < nodeDataList.length; n++)
            {
              nodeData.tree.children.push(this.createPerson(nodeData, nodeDataList[n], "child", n, nodeDataList.length));
            }
            
            this._adjustPosition();
            
          }.bind(this));
        }
      }.bind(this);
      
      
      if (!parentNodeData)
      {
        nodeData.tree.loadParents();
        nodeData.tree.loadChildren();
      }
      else
      {
        parentNodeData.tree.parentsVisible.subscribe(function(value)
        {
          if (value)
          {
            nodeData.tree.loadParents();
          }
        });
        
        parentNodeData.tree.childrenVisible.subscribe(function(value)
        {
          if (value)
          {
            nodeData.tree.loadChildren();
          }
        });
      }
      
      return nodeData;
    },
    afterRender: function()
    {
      this._center();
      this.zoomSet(1);
    },
    activate: function()
    {
      if (loaded)
      {
        return;
      }
      
      this.zoomSet(1);
      person(false);
      loading(true);
      
      murrix.server.emit("node.find", { query: { _id: murrix.nodeId() }, age: true }, function(error, nodeDataList)
      {
        loading(false);

        if (error)
        {
          errorText(error);
          console.log(error);
          return;
        }

        if (nodeDataList.length === 0)
        {
          errorText("Could not find any node matching the query!");
          console.log(errorText());
          return;
        }
        
        loaded = true;
        person(this.createPerson(null, nodeDataList[0], "me", 0, 1));

      }.bind(this));
    }
  };
});
