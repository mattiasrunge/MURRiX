
define([
  "zone",
  "text!./index.html",
  "notification",
  "router",
  "knockout",
  "moment",
  "murrix"
], function(zone, template, notification, router, ko, moment, murrix) {
  return zone({
    template: template,
    route: "/year/:year",
    transition: "entrance-in",
    onInit: function() {
      this.model.type = ko.observable("search");
      this.model.title = ko.observable("Browse by year");
      this.model.icon = ko.observable("fa-clock-o");
      this.model.loading = ko.observable(false);
      this.model.list = ko.observableArray();
      this.model.year = ko.observable(new Date().getFullYear());
      this.model.sliding = ko.observable(false);
      
      var timer = false;
      
      this.model.year.subscribe(function(value) {
        if (timer) {
          clearTimeout(timer);
          timer = false;
        }

        if (!this.model.sliding()) {
          timer = setTimeout(function() {
            timer = false;
            router.navigateTo(this.model.path() + "/" + value);
          }.bind(this), 200);
        }
      }.bind(this));
      
      this.model.increase = function() {
        this.model.year(parseInt(this.model.year(), 10) + 1);
      }.bind(this);
      
      this.model.decrease = function() {
        this.model.year(parseInt(this.model.year(), 10) - 1);
      }.bind(this);
    },
    onLoad: function(d, args) {
      this.model.loading(true);
      this.model.list.removeAll();

      this.model.sliding(true); // Prevent recursive update
      this.model.year(args.year ? args.year : new Date().getFullYear());
      this.model.sliding(false);

      var startTime = moment([ this.model.year() ]);
      var endTime = startTime.clone().add("years", 1);

      murrix.server.emit("node.findByYear", { year: this.model.year() }, function(error, nodeDataList) {
        this.model.loading(false);

        if (error) {
          notification.error(error);
          d.reject(error);
          return;
        }

        this.model.list(nodeDataList);
        d.resolve();
      }.bind(this));
    }
  });
});
