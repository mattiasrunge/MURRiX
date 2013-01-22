
var OrganizeModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable(""), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { murrix.updatePath(value, self.path); });

  self.show = ko.observable(false);

  parentModel.path().primary.subscribe(function(value)
  {
    if (self.show() !== (value.action === "organize"))
    {
      self.show(value.action === "organize");
    }
  });

  self.show.subscribe(function(value)
  {
    if (value)
    {
      parentModel.title("MURRiX - Organize");
    }
  });

  self.mode = ko.observable("move");

  self.setMoveMode = function()
  {
    self.mode("move");
  };

  self.setLinkMode = function()
  {
    self.mode("link");
  };

  self.loading = ko.observable(false);
  self.errorText = ko.observable("");

  self.leftActiveNode = ko.observable(false);
  self.rightActiveNode = ko.observable(false);

  self.leftNodes = ko.observableArray();
  self.rightNodes = ko.observableArray();

  self.leftNodeItems = ko.observableArray();
  self.rightNodeItems = ko.observableArray();

  self.leftPaneTypeaheadUpdater = function(key)
  {
    murrix.cache.getNode(key, function(error, node)
    {
      self.leftNodes.push(node);

      self.leftSetActiveNode(node);
    });
  };

  self.rightPaneTypeaheadUpdater = function(key)
  {
    murrix.cache.getNode(key, function(error, node)
    {
      self.rightNodes.push(node);

      self.rightSetActiveNode(node);
    });
  };

  self.leftCloseActive = function()
  {
    var list = [];

    list = self.leftNodes().filter(function(element)
    {
      return element._id() !== self.leftActiveNode()._id();
    });

    self.leftNodes(list);
    self.leftSetActiveNode(false);
  };

  self.rightCloseActive = function()
  {
    var list = [];

    list = self.rightNodes().filter(function(element)
    {
      return element._id() !== self.rightActiveNode()._id();
    });

    self.rightNodes(list);
    self.rightSetActiveNode(false);
  };

  self.leftSetActiveNode = function(node)
  {
    self.leftActiveNode(node);

    self.loadLeftNodeItems();
  };

  self.rightSetActiveNode = function(node)
  {
    self.rightActiveNode(node);

    self.loadRightNodeItems();
  };

  self.loadNodeItems = function(node, callback)
  {
    var query = { $or: [] };

    query.$or.push({ _parents: node()._id()});

    self.loading(true);

    murrix.server.emit("find", { query: query, options: "items" }, function(error, itemDataList)
    {
      self.loading(false);

      if (error)
      {
        callback(error);
        return;
      }

      var itemList = [];

      for (var id in itemDataList)
      {
        itemList.push(murrix.cache.addItemData(itemDataList[id]));
      }

      itemList.sort(murrix.compareItemFunction);

      callback(null, itemList);
    });
  };

  self.loadLeftNodeItems = function()
  {
    self.leftNodeItems.removeAll();

    if (self.leftActiveNode() !== false)
    {
      self.loadNodeItems(self.leftActiveNode, function(error, itemList)
      {
        if (error)
        {
          self.errorText(error);
          return;
        }

        self.leftNodeItems(itemList);
      });
    }
  };

  self.loadRightNodeItems = function()
  {
    self.rightNodeItems.removeAll();

    if (self.rightActiveNode() !== false)
    {
      self.loadNodeItems(self.rightActiveNode, function(error, itemList)
      {
        if (error)
        {
          self.errorText(error);
          return;
        }

        self.rightNodeItems(itemList);
      });
    }
  };

  self.dragStart = function(element, event)
  {
    event.originalEvent.dataTransfer.setData("id", element._id());
    return true;
  };

  self.dragEnd = function(element, event)
  {
  };

  self.dragOver = function(element, event)
  {
  };

  self.dragDropLeft = function(element, event)
  {
    murrix.cache.getItem(event.originalEvent.dataTransfer.getData("id"), function(error, item)
    {
      if (error)
      {
        self.errorText(error);
        return;
      }

      if (murrix.inArray(self.leftActiveNode()._id(), item._parents()))
      {
        return;
      }

      var itemData = ko.mapping.toJS(item);

      if (self.mode() === "move")
      {
        itemData._parents = murrix.removeFromArray(self.rightActiveNode()._id(), itemData._parents);
      }

      itemData._parents.push(self.leftActiveNode()._id());

      self.loading(true);
      self.errorText("");

      murrix.server.emit("saveItem", itemData, function(error, itemData)
      {
        self.loading(false);

        if (error)
        {
          self.errorText(error);
          return;
        }

        murrix.cache.addItemData(itemData);

        self.loadLeftNodeItems();

        if (self.mode() === "move")
        {
          self.loadRightNodeItems();
        }
      });
    });
  };

  self.dragDropRight = function(element, event)
  {
    murrix.cache.getItem(event.originalEvent.dataTransfer.getData("id"), function(error, item)
    {
      if (error)
      {
        self.errorText(error);
        return;
      }

      if (murrix.inArray(self.rightActiveNode()._id(), item._parents()))
      {
        return;
      }

      var itemData = ko.mapping.toJS(item);

      if (self.mode() === "move")
      {
        itemData._parents = murrix.removeFromArray(self.leftActiveNode()._id(), itemData._parents);
      }

      itemData._parents.push(self.rightActiveNode()._id());

      self.loading(true);
      self.errorText("");

      murrix.server.emit("saveItem", itemData, function(error, itemData)
      {
        self.loading(false);

        if (error)
        {
          self.errorText(error);
          return;
        }

        murrix.cache.addItemData(itemData);

        self.loadRightNodeItems();

        if (self.mode() === "move")
        {
          self.loadLeftNodeItems();
        }
      });
    });
  };
};
