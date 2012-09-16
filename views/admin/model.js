
var AdminModel = function(parentModel, initialUserNodeId)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable({ action: "", args: [] }), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { $.murrix.updatePath(value, self.path); });

  self.show = ko.computed(function() { return parentModel.path().primary().action === "admin"; });


  self.groupNodeList = ko.observableArray([]);
  self.userNodeList = ko.observableArray([]);
  self.accessable = ko.observable(false);

  parentModel.userModel.currentUserNode.subscribe(function(node)
  {
    self.groupNodeList.removeAll();
    self.userNodeList.removeAll();
    self.accessable(false);
  
    if (node === false)
    {
      return;
    }

    if (node.attr("Username") === "admin")
    {
      self.accessable(true);


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
    }
  });

  

};
