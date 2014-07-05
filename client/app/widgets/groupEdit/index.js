
define([
  "widget",
  "text!./index.html",
  "notification",
  "knockout",
  "murrix"
], function(widget, template, notification, ko, murrix) {
  widget({
    template: template,
    name: "groupEdit",
    onCreate: function(settings) {
      this.model.group = settings.group;
      this.model.loading = settings.loading;

      this.model.name = ko.observable("");
      this.model.description = ko.observable("");

      this.subscriptions.push(this.model.group.subscribe(function() {
        this.model.reset();
      }.bind(this)));

      this.model.reset = function() {
        if (this.model.group() !== false) {
          this.model.name(this.model.group().name);
          this.model.description(this.model.group().description);
        } else {
          this.model.name(false);
          this.model.description("");
        }
      }.bind(this);

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

          this.model.group(groupData);
          notification.success("Group saved successfully!");
        }.bind(this));
      }.bind(this);

      this.model.reset();
    }
  });
});
