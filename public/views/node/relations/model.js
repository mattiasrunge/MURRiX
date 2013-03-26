var temp = null;
var RelationsModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable(""), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { murrix.updatePath(value, self.path); });

  self.show = ko.observable(false);
  self.enabled = ko.observable(true);
  self.tree = ko.observable(false);
  self.loading = ko.observable(false);
  self.loaded = ko.observable(false);
  self.zoom = ko.observable(1);
  self.renderTimer = null;

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
    self.tree(false);
    self.zoom(1);
    self.loaded(false);
    self.load();
  });

  self.show.subscribe(function(value)
  {
    if (value)
    {
      self.load();

      if (!self.renderTimer)
      {
        self.renderTimer = setInterval(function()
        {
          if ($(".relation-container").is(":visible"))
          {
            $(".relation-container").on("mousewheel DOMMouseScroll", function(event) { self.scrollHandler(null, event); });

            clearInterval(self.renderTimer);
            self.renderTimer = null;
          }
        }, 500);
      }
    }
  });

  self.dragging = false;
  self.canvasElement = false;

  self.startDragHandler = function(data, event)
  {
    self.dragging = { top: event.clientY, left: event.clientX };
    self.canvasElement = $("#relation-canvas");
  };

  self.dragHandler = function(data, event)
  {
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
  };

  self.stopDragHandler = function(data, event)
  {
    self.dragging = false;
    self.canvasElement = false;
  };

  self.scrollHandler = function(data, event)
  {
    var wheelData = event.originalEvent.detail ? event.originalEvent.detail * -1 : event.originalEvent.wheelDelta / 40;

    wheelData /= 50;

    event.preventDefault();
    event.stopPropagation();

    self.zoom(murrix.round(self.zoom() + wheelData, 1));
    self._adjustCanvasPosition();
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
    self.meOffset = $(".relationMe").offset();
    self.canvasSize = { width: $("#relation-canvas").width(), height: $("#relation-canvas").height() };
  };

  self._adjustCanvasPosition = function()
  {
    var size = { width: $("#relation-canvas").width(), height: $("#relation-canvas").height() };

    var diffHeight = (self.canvasSize.height - size.height) / 2;
    var diffWidth = (self.canvasSize.width - size.width) / 2;

    var position = $("#relation-canvas").position();

    $("#relation-canvas").css("top", position.top + diffHeight);
    $("#relation-canvas").css("left", position.left + diffWidth);

    self._storePosition();
  };

  self._adjustPosition = function()
  {
    var offset = $(".relationMe").offset();

    var diffTop = self.meOffset.top - offset.top;
    var diffLeft = self.meOffset.left - offset.left;

    var position = $("#relation-canvas").position();

    $("#relation-canvas").css("top", position.top + diffTop);
    $("#relation-canvas").css("left", position.left + diffLeft);

    self._storePosition();
  };

  self._center = function()
  {
    var meElement = $(".relationMe");

    var position = meElement.offset();

     position.top -= $("#relation-canvas").offset().top;
     position.left -= ($(window).width() - meElement.width()) / 2;
     position.top -= ($(window).height() - meElement.height()) / 2;

    $("#relation-canvas").css("top", -position.top);
    $("#relation-canvas").css("left", -position.left);

    self._storePosition();
  };

//   self._generatePerson = function(type, depth, positions)
//   {
//     type = type || "me";
//     depth = depth || 0;
//     positions = positions || { first: false, last: false };
//
//     var person = {};
//     person.name = "Person:" + type + ":" + depth;
//     person.parents = [];
//     person.type = type;
//     person.birth = "1999-01-01";
//     person.death = "2100-08-08";
//     person.partner = { name: "Name partner" };
//     person.first = positions.first;
//     person.last = positions.last;
//     person.children = [];
//
//     if (depth < 3)
//     {
//       if (type === "me" || type === "parent")
//       {
//         person.parents.push(self._generatePerson("parent", depth + 1, { first: true, last: false}));
//         person.parents.push(self._generatePerson("parent", depth + 1, { first: false, last: true}));
//       }
//
//       if (type === "me" || type === "child")
//       {
//         var count = 3;//Math.floor(Math.random() * (5 - 0 + 1)) + 0;
//         for (var n = 0; n < count; n++)
//         {
//           person.children.push(self._generatePerson("child", depth + 1, { first: (0 === n), last: (n + 1 === count) }));
//         }
//       }
//     }
//
//     return person;
//   }

  self.load = function()
  {
    if (self.show() && !self.loaded() && parentModel.node() !== false)
    {
      self.loading(true);

      murrix.server.emit("helper_nodeGetRelations", { nodeId: parentModel.node()._id() }, function(error, person)
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

        traverseTree(person);

        console.log("RelationsModel: Loaded!");
        self.loaded(true);
        self.tree(person);
        self._storePosition();
        self._center();
      });
    }
  };
}
