
define([
  "zone", 
  "router", 
  "text!./index.html",
  "knockout",
  "bootstrap",
  "moment",
  "murrix"
], function(zone, router, template, ko, bootstrap, moment, murrix) {
  return zone({
    template: template,
    route: "/search/:query",
    onInit: function() {
      this.model.title = ko.observable("Search by name");
      this.model.icon = ko.observable("fa-search");
      this.model.errorText = ko.observable();
      this.model.loading = ko.observable(false);
      this.model.query = ko.observable("");
      this.model.list = ko.observableArray();
      
      this.model.submit = function() {
        router.navigateTo(this.getPath() + "/" + this.model.query());
      }.bind(this);
    },
    onLoad: function(d, args) {
      this.model.query(args.query);
      this.model.loading(true);
      this.model.list.removeAll();

      murrix.server.emit("node.find", { query: { name: { $regex: ".*" + args.query + ".*", $options: "-i" } } }, function(error, nodeDataList) {
        this.model.loading(false);
        
        if (error) {
          this.model.errorText(error);
          d.resolve();
          return;
        }

        this.model.list(nodeDataList);
        d.resolve();
      }.bind(this));
    }
  });
});
