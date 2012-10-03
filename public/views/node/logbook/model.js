
var LogbookModel = function(parentModel)
{
  var self = this;

  self.path = ko.observable({ primary: ko.observable(""), secondary: ko.observable("") });
  parentModel.path().secondary.subscribe(function(value) { $.murrix.updatePath(value, self.path); });

  self.show = ko.computed(function() { return parentModel.path().primary().action === "logbook"; });
  self.enabled = ko.observable(true);
  
  self.entries = ko.observableArray([ ]);
  self.formDate = ko.observable("");
  self.formTime = ko.observable("");
  self.formText = ko.observable("");
  self.saving = ko.observable(false);
  self.statusText = ko.observable("");
  
  $("#logbookFormDate").datepicker({ format: 'yyyy-mm-dd', weekStart: 1 });
  

  self.editClicked = function()
  {
    console.log(self.entries.indexOf(this));
    console.log(this);

    return false;
  };

  self.formSubmit = function(form)
  {
//     if ($("#logbookFormDate").find("input").val().length > 0 && self.formTime().length > 0 && self.formText().length > 0)
//     {
//       var datetime = $("#logbookFormDate").find("input").val() + " " + self.formTime();
//     
//       var node_data = {};
// 
//       node_data.type        = "logentry";
//       node_data.name        = "Logentry " + datetime;
//       node_data.description = self.formText();
//       node_data.attributes  = {};
// 
//       self.saving(true);
//       self.statusText("");
// 
//       $.murrix.module.db.createNode(node_data, function(transaction_id, result_code, node_data)
//       {
//         if (MURRIX_RESULT_CODE_OK == result_code)
//         {
//           var position = {};
// 
//           position.source = "manual";
//           position.type = "None";
//           position.datetime = datetime;
//         
//           $.murrix.module.db.addPositions(node_data.id, [ position ], function(transaction_id, result_code)
//           {
//             if (MURRIX_RESULT_CODE_OK == result_code)
//             {
//               $.murrix.module.db.linkNodes(parentModel.currentNode().id, node_data.id, "logentry", function(transaction_id, result_code, node_up, node_down, role)
//               {
//                 if (MURRIX_RESULT_CODE_OK == result_code)
//                 {
//                   $.murrix.module.db.fetchNodesBuffered([ parentModel.currentNode().id ], function(transaction_id, result_code, node_list)
//                   {
//                     if (MURRIX_RESULT_CODE_OK == result_code)
//                     {
//                       parentModel.currentNode(node_list[parentModel.currentNode().id]);
//                       self.statusText("Saved new log entry successfully!");
//                     }
//                     else
//                     {
//                       self.statusText("Failed with code " + result_code);
//                     }
// 
//                     self.saving(false);
//                   });
//                 }
//                 else
//                 {
//                   self.statusText("Failed with code " + result_code);
//                 }
// 
//                 self.saving(false);
//               });
//             }
//             else
//             {
//               self.statusText("Failed with code " + result_code);
//             }
// 
//             self.saving(false);
//           });
//         }
//         else
//         {
//           self.statusText("Failed with code " + result_code);
//         }
// 
//         self.saving(false);
//       });
//     }
//     else
//     {
//       self.statusText("You must fill in all the fields!");
//     }
//     
//     return false;
  };

  parentModel.node.subscribe(function(node)
  {
//     self.formDate("");
//     $("#logbookFormDate").find("input").val("");
//     self.formTime("");
//     self.formText("");
//     self.statusText("");
//     self.saving(false);
//     self.entries.removeAll();
// 
//     if (!node)
//     {
//       console.log("Node is false, not looking for log entries!");
//       return;
//     }
// 
//     console.log("Looking for log entries...");
//     node.getLinkedNodes("logentry", function(resultCode, logentryIdList, nodeList)
//     {
//       if (resultCode != MURRIX_RESULT_CODE_OK)
//       {
//         console.log("Got error while trying to fetch required nodes, resultCode = " + resultCode);
//       }
//       else
//       {
//         $.murrix.module.db.fetchPositions({ node_id_list : logentryIdList }, function(transactionId, resultCode, positionList)
//         {
//           if (resultCode != MURRIX_RESULT_CODE_OK)
//           {
//             console.log("Got error while trying to fetch positions, resultCode = " + resultCode);
//           }
//           else
//           {
//             var entries = [];
// 
//             jQuery.each(nodeList, function(id, logentryNode)
//             {
//               var datetime = "";
// 
//               if (positionList[logentryNode.id()] && positionList[logentryNode.id()][0])
//               {
//                 datetime = positionList[logentryNode.id()][0].datetime;
//               }
// 
//               entries.push({
//                 title: logentryNode.name(),
//                 text: logentryNode.description(),
//                 datetime: datetime,
//                 id: logentryNode.id()
//               });
//             });
// 
//             entries.sort(function(a, b)
//             {
//               return Date.parse(a.datetime) - Date.parse(b.datetime);
//             });
// 
//             self.entries(entries);
//           }
//         });
//       }
//     });
  });
};
