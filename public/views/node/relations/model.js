var temp = null;
var RelationsModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable(""), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { murrix.updatePath(value, self.path); });

  self.show = ko.observable(false);
  self.enabled = ko.observable(true);
  self.tree = ko.observable(false);
  self.count = ko.observable(0);
  self.loading = ko.observable(false);
  self.loaded = ko.observable(false);
  self.zoom = ko.observable(1);

  parentModel.path().primary.subscribe(function(value)
  {
    if (self.show() !== (value.action === "relations"))
    {
      self.show(value.action === "relations");
    }
  });

  parentModel.node.subscribe(function(value)
  {
    self.enabled(value !== false && value.type() === "person")

    self.init();
  });

  self.show.subscribe(function(value)
  {
    self.enabled(parentModel.node() !== false && parentModel.node().type() === "person")

    self.init();
  });

  self.init = function()
  {
    if (self.show() && parentModel.node() !== false)
    {
      self.loaded(false);
      self.load();
    }
  };

  self.dragging = false;
  self.canvasElement = false;

  self.startDragHandler = function(data, event)
  {
    self.dragging = { top: event.clientY, left: event.clientX };
    self.canvasElement = $("#relation-canvas");
  };

  self.dragHandler = function(data, event)
  {
    event.preventDefault();
    event.stopPropagation();

    if (self.dragging)
    {
      var diffTop = event.clientY - self.dragging.top;
      var diffLeft = event.clientX - self.dragging.left;

      var position = self.canvasElement.position();

      self.canvasElement.css("top", position.top + diffTop);
      self.canvasElement.css("left", position.left + diffLeft);

      self.dragging = { top: event.clientY, left: event.clientX };
      self._storePosition();
    }
    else if (self.markDragging)
    {
      var top = event.clientY - self.markElement.offset().top;

      self.setZoomByPosition(top, true);
    }
  };

  self.stopDragHandler = function(data, event)
  {
    event.preventDefault();
    event.stopPropagation();

    if (self.dragging)
    {
      self.dragging = false;
      self.canvasElement = false;
    }

    if (self.markDragging)
    {
      var top = event.clientY - self.markElement.offset().top;

      self.setZoomByPosition(top);

      self.markDragging = false;
    }
  };

  self.scrollHandler = function(data, event)
  {
    var wheelData = event.originalEvent.detail ? event.originalEvent.detail * -1 : event.originalEvent.wheelDelta / 40;

    wheelData /= 50;

    event.preventDefault();
    event.stopPropagation();

    self.zoomSet(murrix.round(self.zoom() + wheelData, 1));
  };

  self.zoomSet = function(value, noanimation)
  {
    value = value < 0.2 ? 0.2 : value;
    value = value > 1.6 ? 1.6 : value;

    self.zoom(value);
    self._adjustCanvasPosition();

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
  };

  self.zoomInc = function()
  {
    self.zoomSet(self.zoom() + 0.1);
  };

  self.zoomDec = function()
  {
    self.zoomSet(self.zoom() - 0.1);
  };

  self.markContainerClickHandler = function(data, event)
  {
    event.preventDefault();
    event.stopPropagation();

    if (event.srcElement !== $(".mark-container")[0])
    {
      return;
    }

    self.setZoomByPosition(event.offsetY);
  };

  self.setZoomByPosition = function(top, noanimation)
  {
    var containerHeight = $(".mark-container").innerHeight();
    var markHeight = $(".mark-container .mark").outerHeight();

    top -= markHeight;
    containerHeight -= markHeight;

    var step = containerHeight / 14;

    self.zoomSet(murrix.round((containerHeight - top) / (step * 10), 1) + 0.1, noanimation);
  };

  self.markDragging = false;
  self.markElement = false;

  self.startDragMarkHandler = function(data, event)
  {
    event.preventDefault();
    event.stopPropagation();

    self.markElement = $(".mark-container");
    self.markDragging = true;
  };

  self.personClickHandler = function(data)
  {
    document.location.hash = "#node:" + data._id + "/relations";
    event.preventDefault();
    event.stopPropagation();
  };

  self.personPartnerClickHandler = function(data)
  {
    document.location.hash = "#node:" + data.partner._id + "/relations";
    event.preventDefault();
    event.stopPropagation();
  };

  self.expandParentsClicked = function(data, element)
  {
    data.showParents(!data.showParents());
    self._adjustPosition();
  };

  self.expandChildrenClicked = function(data, event)
  {
    data.showChildren(!data.showChildren());
    self._adjustPosition();
  };


  self.meOffset = { top: 0, left: 0 };
  self.canvasSize = { width: 0, height: 0 };

  self._storePosition = function()
  {
    var canvasElement = $("#relation-canvas");
    var meElement = $(".relation-me");

    self.meOffset = meElement.offset();
    self.canvasSize = { width: canvasElement.width(), height: canvasElement.height() };
  };

  self._adjustCanvasPosition = function()
  {
    var canvasElement = $("#relation-canvas");

    if (canvasElement.is(":visible"))
    {
      var size = { width: canvasElement.width(), height: canvasElement.height() };

      var diffHeight = (self.canvasSize.height - size.height) / 2;
      var diffWidth = (self.canvasSize.width - size.width) / 2;

      var position = canvasElement.position();

      canvasElement.css("top", position.top + diffHeight);
      canvasElement.css("left", position.left + diffWidth);

      self._storePosition();
    }
  };

  self._adjustPosition = function()
  {
    var canvasElement = $("#relation-canvas");

    if (canvasElement.is(":visible"))
    {
      var meElement = $(".relation-me");
      var offset = meElement.offset();

      var diffTop = self.meOffset.top - offset.top;
      var diffLeft = self.meOffset.left - offset.left;

      var position = canvasElement.position();

      canvasElement.css("top", position.top + diffTop);
      canvasElement.css("left", position.left + diffLeft);

      self._storePosition();
    }
  };

  self._center = function()
  {
    var canvasElement = $("#relation-canvas");
    var meElement = $(".relation-me");

    if (meElement.length > 0)
    {
      var position = meElement.position();

      position.left -= ($(window).width() - meElement.width()) / 2;
      position.top -= ($(window).height() - meElement.height()) / 2;

      canvasElement.css("top", -position.top);
      canvasElement.css("left", -position.left);

      self._storePosition();
    }
  };

  self.load = function()
  {
    if (self.show() && !self.loaded() && parentModel.node() !== false)
    {
      self.tree(false);
      self.zoomSet(1);
      self.loading(true);

      murrix.server.emit("helper_nodeGetRelations", { nodeId: parentModel.node()._id() }, function(error, data)
      {
        self.loading(false);

        if (error)
        {
          console.log(error);
          return;
        }

        var traverseTree = function(node, first, last, depth)
        {
          first = first || false;
          last = last || false;
          depth = depth || 0;

          node.showParents = ko.observable(depth < 1);
          node.showChildren = ko.observable(depth < 1);
          node.first = first;
          node.last = last;

          for (var n = 0; n < node.children.length; n++)
          {
            traverseTree(node.children[n], n === 0, n + 1 === node.children.length, depth + 1);
          }

          for (var n = 0; n < node.parents.length; n++)
          {
            traverseTree(node.parents[n], n === 0, n + 1 === node.parents.length, depth + 1);
          }
        }

        traverseTree(data.tree);

        console.log("RelationsModel: Loaded!");
        self.loaded(true);
        self.count(data.count);
        self.tree(data.tree);

        self._center();
        self.zoomSet(1);
      });

      self._center();
      self.zoomSet(self.zoom());
    }
  };
}
