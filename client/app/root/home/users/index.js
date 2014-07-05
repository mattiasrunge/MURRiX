
define([
  "zone",
  "text!./index.html",
  "notification",
  "knockout",
  "murrix"
], function(zone, template, notification, ko, murrix) {
  return zone({
    template: template,
    route: "/users/:id",
    transition: "entrance-in",
    onInit: function() {
      this.model.type = ko.observable("admin");
      this.model.title = ko.observable("Users");
      this.model.icon = ko.observable("fa-user");
      this.model.errorText = ko.observable();
      this.model.successText = ko.observable();
      this.model.loading = ko.observable(false);
      this.model.list = ko.observableArray();
      this.model.user = ko.observable(false);
      
      // TODO: User add should reload
      
      this.model.deleteUser = function(data) {
        if (confirm("Are you sure you want to delete " + data.name + "?")) {
          murrix.server.emit("user.remove", data._id, function(error) {
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
      murrix.server.emit("user.find", { options: { sort: [ 'name' ] }}, function(error, userDataList) {
        if (error) {
          notification.error(error);
          d.reject(error);
          return;
        }

        var list = [];
        for (var key in userDataList) {
          list.push(userDataList[key]);
        }
        
        this.model.list(list);
        this.model.user(false);
        
        if (args.id) {
          this.model.user(userDataList[args.id]);
        }
        
        d.resolve();        
      }.bind(this));
    }
  });
});
