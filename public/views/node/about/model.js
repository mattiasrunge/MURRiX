
var AboutModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable(""), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { murrix.updatePath(value, self.path); });

  self.show = ko.observable(false);

  parentModel.path().primary.subscribe(function(value)
  {
    if (self.show() !== (value.action === "about"))
    {
      self.show(value.action === "about");
    }
  });

  self.enabled = ko.observable(true);

  self.show.subscribe(function(value)
  {
    if (value && parentModel.node() !== false)
    {
      self.loadHomes();
      self.loadOwnerOf();
      self.loadChildren();
    }
  });

  parentModel.node.subscribe(function(value)
  {
    if (self.show() && value !== false)
    {
      self.loadHomes();
      self.loadOwnerOf();
      self.loadChildren();
    }
  });


  self.age = ko.computed(function()
  {
    var age = false;

    for (var n = 0; n < parentModel.items().length; n++)
    {
      if (parentModel.items()[n].what() === "text" && parentModel.items()[n].type() === "birth")
      {
        age = murrix.getAge(parentModel.items()[n].when.timestamp());
        break;
      }
    }

    return age;
  });


  self.childrenLoading = ko.observable(false);
  self.childrenErrorText = ko.observable("");
  self.children = ko.observableArray();

  self.loadChildren = function()
  {
    self.children.removeAll();

    if (parentModel.node() && parentModel.node().type() === 'person')
    {
      var query = { $or: [] };

      query.type = { $in : [ "person" ] };
      query["family.parents._id"] = parentModel.node()._id();

      self.childrenErrorText("");
      self.childrenLoading(true);

      murrix.server.emit("find", { query: query, options: "nodes" }, function(error, nodeDataList)
      {
        self.childrenLoading(false);

        if (error)
        {
          self.childrenErrorText(error);
          return;
        }

        var nodeList = [];

        for (var id in nodeDataList)
        {
          nodeList.push(murrix.cache.addNodeData(nodeDataList[id]));
        }

        self.children(nodeList);
      });
    }
  };

  self.homesLoading = ko.observable(false);
  self.homesErrorText = ko.observable("");
  self.homes = ko.observableArray();

  self.loadHomes = function()
  {
    self.homes.removeAll();

    if (parentModel.node() && parentModel.node().type() === 'person')
    {
      var query = { $or: [] };

      query.type = { $in : [ "location" ] };
      query._id = { $in: parentModel.node()._homes() };

      self.homesErrorText("");
      self.homesLoading(true);

      murrix.server.emit("find", { query: query, options: "nodes" }, function(error, nodeDataList)
      {
        self.homesLoading(false);

        if (error)
        {
          self.homesErrorText(error);
          return;
        }

        var nodeList = [];

        for (var id in nodeDataList)
        {
          nodeList.push(murrix.cache.addNodeData(nodeDataList[id]));
        }

        self.homes(nodeList);
      });
    }
  };


  self.ownerOfLoading = ko.observable(false);
  self.ownerOfErrorText = ko.observable("");
  self.ownerOf = ko.observableArray();

  self.loadOwnerOf = function()
  {
    self.ownerOf.removeAll();

    if (parentModel.node() && parentModel.node().type() === 'person')
    {
      var query = { $or: [] };

      query._owner = parentModel.node()._id();

      self.ownerOfErrorText("");
      self.ownerOfLoading(true);

      murrix.server.emit("find", { query: query, options: "nodes" }, function(error, nodeDataList)
      {
        self.ownerOfLoading(false);

        if (error)
        {
          self.ownerOfErrorText(error);
          return;
        }

        var nodeList = [];

        for (var id in nodeDataList)
        {
          nodeList.push(murrix.cache.addNodeData(nodeDataList[id]));
        }

        self.ownerOf(nodeList);
      });
    }
  };
};

