

define([
  "zone",
  "text!./index.html",
  "notification",
  "knockout",
  "murrix"
], function(zone, template, notification, ko, murrix) {
  return zone({
    template: template,
    route: "/group/:id",
    transition: "entrance-in",
    onInit: function() {
      this.model.type = ko.observable("admin");
      this.model.title = ko.observable("Groups");
      this.model.icon = ko.observable("fa-group");
      this.model.loading = ko.observable(false);
      this.model.list = ko.observableArray();
      this.model.group = ko.observable(false);
      
      // TODO: Group add should reload
      
      this.model.deleteGroup = function(data) {
        if (confirm("Are you sure you want to delete " + data.name + "?")) {
          murrix.server.emit("group.remove", data._id, function(error) {
            if (error) {
              notification.error(error);
              return;
            }

            router.reload();
          }.bind(this));
        }
      }.bind(this);
    },
    onLoad: function(d, args) {
      murrix.server.emit("group.find", { options: { sort: [ 'name' ] }}, function(error, groupDataList) {
        if (error) {
          notification.error(error);
          d.reject(error);
          return;
        }

        var list = [];
        for (var key in groupDataList) {
          list.push(groupDataList[key]);
        }
        
        this.model.list(list);
        this.model.group(false);
        
        if (args.id) {
          this.model.group(groupDataList[args.id]);
        }
        
        d.resolve();        
      }.bind(this));
    }
  });
});

