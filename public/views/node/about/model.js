
var AboutModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable(""), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { murrix.updatePath(value, self.path); });

  self.show = ko.observable(false);

  parentModel.path().primary.subscribe(function(value)
  {
    var show = (value.action === "about" || value.action === "") && parentModel.show();

    if (self.show() !== show)
    {
      self.show(show);
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
      self.loadShowing();
      self.loadWhos();
    }
  });

  parentModel.node.subscribe(function(value)
  {
    if (self.show() && value !== false)
    {
      self.loadAge();
      self.loadHomes();
      self.loadOwnerOf();
      self.loadShowing();
      self.loadWhos();
    }
  });


  self.ageNow = ko.observable(false);
  self.ageAtDeath = ko.observable(false);
  self.birthTimestamp = ko.observable(false);
  self.deathTimestamp = ko.observable(false);

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

        self.birthTimestamp(age.birthTimestamp);
        self.deathTimestamp(age.deathTimestamp);
        self.ageNow(age.ageNow);
        self.ageAtDeath(age.ageAtDeath);
      });
    }
    else
    {
      self.birthTimestamp(false);
      self.deathTimestamp(false);
      self.ageNow(false);
      self.ageAtDeath(false);
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




  self.showingLoading = ko.observable(false);
  self.showingErrorText = ko.observable("");
  self.showing = ko.observableArray();

  self.loadShowing = function()
  {
    self.showing.removeAll();

    if (parentModel.node() && parentModel.node().type() === 'album')
    {
      var query = { };

      self.showingErrorText("");
      self.showingLoading(true);

      murrix.server.emit("helper_nodeGetShowingSuggestions", { nodeId: parentModel.node()._id() }, function(error, nodeIdList)
      {
        self.showingLoading(false);

        if (error)
        {
          console.log(error);
          self.showingErrorText(error);
          return;
        }

        self.showingErrorText("");
        self.showingLoading(true);

        murrix.cache.getNodes(nodeIdList, function(error, nodeList)
        {
          self.showingLoading(false);

          if (error)
          {
            console.log(error);
            self.showingErrorText(error);
            return;
          }

          for (var n in nodeList)
          {
            self.showing.push(nodeList[n]);
          }
        });
      });
    }
  };


  self.whosLoading = ko.observable(false);
  self.whosErrorText = ko.observable("");
  self.whos = ko.observableArray();

  self.loadWhos = function()
  {
    self.whos.removeAll();

    if (parentModel.node() && parentModel.node().type() === 'album')
    {
      var query = { };

      self.whosErrorText("");
      self.whosLoading(true);

      murrix.server.emit("helper_nodeGetWhoSuggestions", { nodeId: parentModel.node()._id() }, function(error, nodeIdList)
      {
        self.whosLoading(false);

        if (error)
        {
          console.log(error);
          self.whosErrorText(error);
          return;
        }

        self.whosErrorText("");
        self.whosLoading(true);

        murrix.cache.getNodes(nodeIdList, function(error, nodeList)
        {
          self.whosLoading(false);

          if (error)
          {
            console.log(error);
            self.whosErrorText(error);
            return;
          }

          for (var n in nodeList)
          {
            self.whos.push(nodeList[n]);
          }
        });
      });
    }
  };



  self.tagLoading = ko.observable(false);
  self.tagErrorText = ko.observable("");
  self.tagName = ko.observable("");
  self.tagHasFocus = ko.observable(true);

  self.tagSaveNode = function(nodeData)
  {
    self.tagErrorText("");
    self.tagLoading(true);

    murrix.server.emit("saveNode", nodeData, function(error, nodeData)
    {
      self.tagLoading(false);

      if (error)
      {
        self.tagErrorText(error);
        return;
      }

      self.tagName("");
      self.tagErrorText("");
      self.tagHasFocus(true);

      murrix.cache.addNodeData(nodeData); // This should update self.node() by reference
    });
  };

  self.tagSubmit = function()
  {
    self.tagErrorText("");

    var nodeData = ko.mapping.toJS(parentModel.node);

    nodeData.tags = nodeData.tags || [];

    if (murrix.inArray(self.tagName(), nodeData.tags))
    {
      self.tagErrorText("Can not save multiple tags with the same name");
      return;
    }

    nodeData.tags.push(self.tagName().toLowerCase().replace(/ /g, "_"));

    self.tagSaveNode(nodeData);
  };

  self.tagRemove = function(tagName)
  {
    var nodeData = ko.mapping.toJS(parentModel.node);

    nodeData.tags = nodeData.tags || [];

    nodeData.tags = nodeData.tags.filter(function(tagNameTest)
    {
      return tagNameTest !== tagName;
    });

    self.tagSaveNode(nodeData);
  };

};
