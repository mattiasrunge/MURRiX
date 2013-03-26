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
          if ($("#relationContainer").is(":visible"))
          {
            $("#relationContainer").overscroll({ captureWheel: false });

            self._center();

            $("#relationContainer").on("mousewheel DOMMouseScroll", function(event)
            {
              var wheelData = event.originalEvent.detail ? event.originalEvent.detail * -1 : event.originalEvent.wheelDelta / 40;

              wheelData /= 50;

              event.preventDefault();
              event.stopPropagation();

//               var zoomBefore = self.zoom();
//               var scrollLeftBefore = $("#relationContainer").scrollLeft();
//               var scrollTopBefore = $("#relationContainer").scrollTop();
// console.log("before", scrollLeftBefore, scrollTopBefore, zoomBefore);



              self.zoom(murrix.round(self.zoom() + wheelData, 1));
//               var width = $(".relationZoom").outerWidth() * self.zoom();
//               var height = $(".relationZoom").outerHeight() * self.zoom();
//               var diffWidth = $(".relationZoom").outerWidth() - width;
//               var diffHeight = $(".relationZoom").outerHeight() - height;
//
//               $(".relationMarginContainer").css("padding-left", (diffWidth) + "px");
// //               $(".relationMarginContainer").css("padding-right", (diffWidth) + "px");
//
//               $(".relationMarginContainer").css("padding-top", (diffHeight) + "px");
//               $(".relationMarginContainer").css("padding-bottom", (diffHeight / 2) + "px");

//               var scrollLeftAfter = $("#relationContainer").scrollLeft();
//               var scrollTopAfter = $("#relationContainer").scrollTop();
// console.log("after", scrollLeftAfter, scrollTopAfter, self.zoom());
//
//               var ratio = wheelData / self.zoom();
// console.log("ratio", ratio);
//
//               $("#relationContainer").scrollLeft(scrollLeftBefore * self.zoom());
//               $("#relationContainer").scrollTop(scrollLeftBefore * self.zoom());

              //self._center();
            });

            clearInterval(self.renderTimer);
            self.renderTimer = null;
          }
        }, 500);
      }
    }
  });

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
    self._center($(event.currentTarget));
  };

  self.expandChildrenClicked = function(data, event)
  {
    data.showChildren(!data.showChildren());
    self._center($(event.currentTarget));
  };

  self._center = function(element)
  {
    if (self.tree() === false)
    {
      return;
    }

    element = element || $(".relationMe");

    $("#relationContainer").scrollLeft(0);
    $("#relationContainer").scrollTop(0);

    var position = element.offset();
    position.top -= $("#relationContainer").offset().top;
    position.left -= ($(window).width() - element.width()) / 2;
    position.top -= ($(window).height() - element.height()) / 2;

    $("#relationContainer").scrollLeft(position.left);
    $("#relationContainer").scrollTop(position.top);
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
        self._center();
      });
    }
  };
}
