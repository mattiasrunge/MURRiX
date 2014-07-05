
define([
  "widget",
  "text!./index.html",
  "notification",
  "knockout",
  "murrix"
], function(widget, template, notification, ko, murrix) {
  widget({
    template: template,
    name: "groupAdd",
    onCreate: function(settings) {
      this.model.loading = settings.loading;

      this.model.name = ko.observable("");
      this.model.description = ko.observable("");
      
      this.model.save = function() {
        if (this.model.name() === "") {
          notification.error("Name can not be empty!");
          return;
        }

        this.model.errorText(false);
        this.model.loading(true);

        murrix.server.emit("group.save", {
          name: this.model.name(),
          description: this.model.description()
        }, function(error, groupData) {
          this.model.loading(false);

          if (error) {
            notification.error(error);
            return;
          }

          settings.group(groupData);
          notification.success("Group created successfully!");
          this.model.name("");
          this.model.description("");
        }.bind(this));
      }.bind(this);
    }
  });
});
