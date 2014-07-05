
define([
  "zone",
  "text!./index.html",
  "knockout",
  "murrix"
], function(zone, template, ko, murrix) {
  return zone({
    template: template,
    route: "/recent",
    transition: "entrance-in",
    onInit: function() {
      this.model.type = ko.observable("search");
      this.model.title = ko.observable("Recent");
      this.model.icon = ko.observable("fa-bell");
      this.model.loading = ko.observable(false);
      this.model.list = ko.observableArray();
    },
    onLoad: function(d, args) {
      this.model.loading(true);
      this.model.list.removeAll();
      
      d.resolve();

//       murrix.server.emit("node.find", { query: { name: { $regex: ".*" + args.query + ".*", $options: "-i" } } }, function(error, nodeDataList) {
//         this.model.loading(false);
//         
//         if (error) {
//           this.model.errorText(error);
//           d.resolve();
//           return;
//         }
// 
//         this.model.list(nodeDataList);
//         d.resolve();
//       }.bind(this));
    }
  });
});
