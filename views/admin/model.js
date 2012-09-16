
var AdminModel = function(parentModel, initialUserNodeId)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable({ action: "", args: [] }), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { $.murrix.updatePath(value, self.path); });

  self.show = ko.computed(function() { return parentModel.path().primary().action === "admin"; });


  self.groupNodeList = ko.observableArray([]);
  self.userNodeList = ko.observableArray([]);
  self.accessable = ko.observable(false);

  self.inputAddUserName = ko.observable("");
  self.inputAddUserUsername = ko.observable("");
  self.inputAddUserPassword = ko.observable("");
  self.errorTextAddUser = ko.observable("");
  self.errorTextSaveUser = ko.observable("");
  
  self.inputAddGroupName = ko.observable("");
  self.errorTextAddGroup = ko.observable("");
  self.errorTextSaveGroup = ko.observable("");
  
  self.loading = ko.observable(false);

  
  self.addUserSubmit = function()
  {
    self.loading(true);
    self.errorTextAddUser("");

    var nodeData = {};

    nodeData.attributes = {};
    nodeData.type = "user";
    nodeData.name = self.inputAddUserName();

    nodeData.attributes.Username = self.inputAddUserUsername();
    nodeData.attributes.Password = self.inputAddUserPassword();
    
    
    $.murrix.module.db.createNode(nodeData, function(transactionId, resultCode, node)
    {
      self.loading(false);

      if (resultCode != MURRIX_RESULT_CODE_OK)
      {
        console.log("AdminModel: Got error while trying to create node, resultCode = " + resultCode);
        self.errorTextAddUser("Failed to add user, try again, resultCode" + resultCode);
      }
      else
      {
        self.inputAddUserName("");
        self.inputAddUserUsername("");
        self.inputAddUserPassword("");
        $(".dropdown.open .dropdown-toggle").dropdown("toggle");

        self.userNodeList.push(node);
      }
    });
  };

  self.addGroupSubmit = function()
  {
    self.loading(true);
    self.errorTextAddGroup("");

    var nodeData = {};

    nodeData.attributes = {};
    nodeData.type = "group";
    nodeData.name = self.inputAddGroupName();


    $.murrix.module.db.createNode(nodeData, function(transactionId, resultCode, node)
    {
      self.loading(false);

      if (resultCode != MURRIX_RESULT_CODE_OK)
      {
        console.log("AdminModel: Got error while trying to create node, resultCode = " + resultCode);
        self.errorTextAddGroup("Failed to add group, try again, resultCode" + resultCode);
      }
      else
      {
        self.inputAddGroupName("");
        $(".dropdown.open .dropdown-toggle").dropdown("toggle");

        self.groupNodeList.push(node);
      }
    });
  };

  self.saveUserSubmit = function(node)
  {
    console.log(node.name());
  };

  self.userRemoveClicked = function(node)
  {
    console.log(node.name());
  };

  self.saveGroupSubmit = function(node)
  {
    console.log(node.name());
  };

  self.groupRemoveClicked = function(node)
  {
    console.log(node.name());
  };

  self.loadUsersAndGroups = function()
  {
    console.log("AdminModel: Loading users and groups");
  
    self.groupNodeList.removeAll();
    self.userNodeList.removeAll();
  
    $.murrix.module.db.searchNodeIds({ types: [ "user", "group" ] }, function(transactionId, resultCode, nodeIdList)
    {
      if (resultCode != MURRIX_RESULT_CODE_OK)
      {
        console.log("AdminModel: Got error while trying to run query, resultCode = " + resultCode);
      }
      else if (nodeIdList.length > 0)
      {
        $.murrix.module.db.fetchNodesBuffered(nodeIdList, function(transactionId, resultCode, nodeList)
        {
          if (resultCode != MURRIX_RESULT_CODE_OK)
          {
            console.log("AdminModel: Got error while trying to run query, resultCode = " + resultCode);
          }
          else
          {
            for (var n = 0; n < nodeList.length; n++)
            {
              if (nodeList[n].type() === "user")
              {
                self.userNodeList.push(nodeList[n]);
              }
              else if (nodeList[n].type() === "group")
              {
                self.groupNodeList.push(nodeList[n]);
              }
            }
          }
        });
      }
      else
      {
        console.log("AdminModel: Found no users or groups");
      }
    });

  };
  
  parentModel.userModel.currentUserNode.subscribe(function(node)
  {

    self.accessable(false);
  
    if (node === false)
    {
      return;
    }

    if (node.attr("Username") === "admin")
    {
      self.accessable(true);

      self.loadUsersAndGroups();
    }
  });

  

};
