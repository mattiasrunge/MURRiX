
var AccessesModel = function(parentModel)
{
  var self = this;

  self.show = ko.observable(false);
  self.loading = ko.observable(false);
  self.error = ko.observable("");

  self.admins = ko.observableArray();
  self.readers = ko.observableArray();
  self.others = ko.observableArray();


  parentModel.node.subscribe(function(value)
  {
    if (value === false)
    {
      self.show(false);
    }

    self.load();
  });

  self.load = function()
  {
    self.admins.removeAll();
    self.readers.removeAll();
    self.others.removeAll();

    if (parentModel.node() !== false && murrix.model.currentUser() !== false)
    {
      var groupIdList = [];

      if (typeof murrix.model.currentUser().admin === "undefined" || murrix.model.currentUser().admin() !== true)
      {
        groupIdList = murrix.model.currentUser()._groups();
        groupIdList = groupIdList.concat(parentModel.node()._readers(), parentModel.node()._admins());
      }

      murrix.cache.getGroups(groupIdList, function(error, groupList)
      {
        if (error)
        {
          console.log("NodeModel: " + error);
          return;
        }

        var listAdmins = [];
        var listReaders = [];
        var listOthers = [];

        for (var n in groupList)
        {
          if (murrix.inArray(groupList[n]._id(), parentModel.node()._admins()))
          {
            listAdmins.push(groupList[n]);
          }
          else if (murrix.inArray(groupList[n]._id(), parentModel.node()._readers()))
          {
            listReaders.push(groupList[n]);
          }
          else
          {
            listOthers.push(groupList[n]);
          }
        }

        self.admins(listAdmins);
        self.readers(listReaders);
        self.others(listOthers);
      });
    }
  };

  self.save = function(nodeData)
  {
    self.loading(true);
    self.error("");

    murrix.server.emit("saveNode", nodeData, function(error, nodeData)
    {
      self.loading(false);

      if (error)
      {
        self.error(error);
        return;
      }

      murrix.cache.addNodeData(nodeData); // This should update parentModel.node() by reference
      self.load();
    });
  };

  self.remove = function(data)
  {
    var nodeData = ko.mapping.toJS(parentModel.node);

    nodeData._readers = nodeData._readers || [];
    nodeData._admins = nodeData._admins || [];

    nodeData._readers = murrix.removeFromArray(data._id(), nodeData._readers);
    nodeData._admins = murrix.removeFromArray(data._id(), nodeData._admins);

    self.save(nodeData);

    event.preventDefault();
    event.stopPropagation();
  };

  self.makeAdmin = function(data)
  {
    var nodeData = ko.mapping.toJS(parentModel.node);

    nodeData._readers = nodeData._readers || [];
    nodeData._admins = nodeData._admins || [];

    nodeData._readers = murrix.removeFromArray(data._id(), nodeData._readers);
    nodeData._admins = murrix.addToArray(data._id(), nodeData._admins);

    self.save(nodeData);

    event.preventDefault();
    event.stopPropagation();
  };

  self.makeReader = function(data)
  {
    var nodeData = ko.mapping.toJS(parentModel.node);

    nodeData._readers = nodeData._readers || [];
    nodeData._admins = nodeData._admins || [];

    nodeData._readers = murrix.addToArray(data._id(), nodeData._readers);
    nodeData._admins = murrix.removeFromArray(data._id(), nodeData._admins);

    self.save(nodeData);

    event.preventDefault();
    event.stopPropagation();
  };

  self.changePublic = function(publicFlag, a, b, c, d)
  {
    self.loading(true);

    var nodeData = ko.mapping.toJS(parentModel.node);

    if (publicFlag)
    {
      nodeData["public"] = true;
    }
    else
    {
      nodeData["public"] = false;
    }

    murrix.server.emit("saveNode", nodeData, function(error, nodeData)
    {
      self.loading(false);

      if (error)
      {
        console.log(error);
        alert("Could not make node " + (publicFlag ? "public" : "private") + "!");
        return;
      }

      murrix.cache.addNodeData(nodeData); // This should update parentModel.node() by reference
    });
  };

};
