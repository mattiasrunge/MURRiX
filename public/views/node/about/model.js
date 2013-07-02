
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
      self.loadAge();
      self.loadHomes();
      self.loadOwnerOf();
      self.loadChildren();
    }
  });

  parentModel.node.subscribe(function(value)
  {
    if (self.show() && value !== false)
    {
      self.loadAge();
      self.loadHomes();
      self.loadOwnerOf();
      self.loadChildren();
    }
  });


  self.ageNow = ko.observable(false);
  self.ageAtDeath = ko.observable(false);

  self.loadAge = function()
  {
    if (parentModel.node() !== false)
    {
      murrix.server.emit("helper_nodeGetAge", { nodeId: parentModel.node()._id() }, function(error, age)
      {
        if (error)
        {
          console.log(error);
          return;
        }

        self.ageNow(age.ageNow);
        self.ageAtDeath(age.ageAtDeath);
      });
    }
    else
    {
      self.ageNow(false);
      self.ageAtDeath(false);
    }
  };


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

    if (parentModel.node() && parentModel.node().type() === 'person' && parentModel.node()._homes && parentModel.node()._homes().length > 0)
    {
      var query = { };

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
      var query = { };

      query._owners = { $in: [ parentModel.node()._id() ] };

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
