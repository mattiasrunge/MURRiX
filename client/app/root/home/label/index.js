
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
    route: "/label",
    transition: "entrance-in",
    onInit: function() {
      this.model.type = ko.observable("search");
      this.model.title = ko.observable("Browse by labels");
      this.model.icon = ko.observable("fa-tag");
      this.model.loading = ko.observable(false);
      this.model.selected = ko.observableArray();
      this.model.labels = ko.observableArray();
      this.model.list = ko.observableArray();
      this.model.mode = ko.observable("or");
      
      this.model.clicked = function(data) {
        if (this.model.loading()) {
          return;
        }

        var pos = this.model.selected().indexOf(data.name);

        if (pos === -1) {
          this.model.selected.push(data.name);
        } else {
          this.model.selected.splice(pos, 1);
        }
        
        this.model.submit();
      }.bind(this);
      
      this.model.mode.subscribe(function() {
        this.model.submit();
      }.bind(this));
        
      this.model.submit = function() {
        var queryString = "";
        var queryList = this.model.selected().map(function(element) {
          return "select[]=" + element;
        });
        
        if (this.model.mode() === "and") {
          queryList.push("mode=and");
        }
        
        if (queryList.length > 0) {
          queryString = "?" + queryList.join("&");
        }
        
        router.navigateTo(this.model.path() + queryString);
      }.bind(this);
    },
    onLoad: function(d, args) {
      this.model.mode(args.mode ? args.mode : "or");
      this.model.selected(args.select ? args.select : []);
      this.model.loading(true);
      this.model.list.removeAll();
      
      murrix.server.emit("node.getLabels", {}, function(error, labelList) {
        this.model.loading(false);

        if (error) {
          notification.error(error);
          d.reject(error);
          return;
        }

        this.model.labels(labelList.map(function(element) {

          return {
            name: element,
            selected: this.model.selected().indexOf(element) !== -1
          };
        }.bind(this)));

        var query = {};

        if (this.model.mode() === "and") {
          query = { tags: { $all: this.model.selected() } };
        } else {
          query = { tags: { $in: this.model.selected() } };
        }

        this.model.loading(true);

        murrix.server.emit("node.find", { query: query }, function(error, nodeDataList) {
          this.model.loading(false);

          if (error) {
            notification.error(error);
            d.reject(error);
            return;
          }

          this.model.list(nodeDataList);
          d.resolve();
        }.bind(this));
      }.bind(this));
    }
  });
});
