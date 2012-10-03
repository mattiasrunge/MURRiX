
var ConnectionsModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable(""), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { $.murrix.updatePath(value, self.path); });

  self.show = ko.observable(false);

  parentModel.path().primary.subscribe(function(value)
  {
    if (self.show() !== (value.action === "connections"))
    {
      self.show(value.action === "connections");
    }
  });
  
  self.enabled = ko.observable(true);


  self.connections = ko.observableArray([ ]);

  parentModel.node.subscribe(function(node)
  {
//     self.connections.removeAll();
// 
//     if (!node)
//     {
//       console.log("Node is false, not looking for comments!");
//       return;
//     }
// 
//     console.log("Looking for linked nodes...");
//     node.getLinkedNodes(null, function(resultCode, nodeIdList, nodeList)
//     {
//       if (resultCode != MURRIX_RESULT_CODE_OK)
//       {
//         console.log("Got error while trying to fetch required nodes, resultCode = " + resultCode);
//       }
//       else
//       {
//         $.murrix.module.db.fetchNodesBufferedIndexed(nodeIdList, function(transactionId, resultCode, nodeList) // Fetch already buffered node list indexed by id
//         {
//           var connections = [];
// 
//           for (var n = 0; n < node.links().length; n++)
//           {
//             var link = node.links()[n];
//             
//             if (nodeList[link.node_id()])
//             {
//               connections.push({ id: link.node_id(), name: nodeList[link.node_id()].name(), role: link.role(), direction: link.direction() });
//             }
//           }
// 
//           self.connections(connections);
//         });
//       }
//     });
  });
};

 
