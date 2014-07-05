
define([
  "zone",
  "text!./index.html",
  "notification",
  "router",
  "knockout",
  "murrix"
], function(zone, template, notification, router, ko, murrix) {
  return zone({
    template: template,
    route: "/search/:query",
    transition: "entrance-in",
    onInit: function() {
      this.model.type = ko.observable("search");
      this.model.title = ko.observable("Search by name");
      this.model.icon = ko.observable("fa-search");
      this.model.loading = ko.observable(false);
      this.model.query = ko.observable("");
      this.model.list = ko.observableArray();
      
      this.model.submit = function() {
        router.navigateTo(this.model.path() + "/" + this.model.query());
      }.bind(this);
    },
    onLoad: function(d, args) {
      this.model.query(args.query);
      this.model.loading(true);
      this.model.list.removeAll();

      murrix.server.emit("node.find", { query: { name: { $regex: ".*" + args.query + ".*", $options: "-i" } } }, function(error, nodeDataList) {
        this.model.loading(false);
        
        if (error) {
          notification.error(error);
          d.resolve();
          return;
        }

        this.model.list(nodeDataList);
        d.resolve();
      }.bind(this));
    }
  });
});
