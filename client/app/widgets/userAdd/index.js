
define([
  "widget",
  "text!./index.html",
  "notification",
  "knockout",
  "murrix"
], function(widget, template, notification, ko, murrix) {
  widget({
    template: template,
    name: "userAdd",
    onCreate: function(settings) {
      this.model.loading = settings.loading;

      this.model.personId = ko.observable(false);
      this.model.name = ko.observable("");
      this.model.username = ko.observable("");
      this.model.email = ko.observable("");
      this.model.password = ko.observable("");
      
      this.model.save = function() {
        if (this.model.username() === "") {
          notification.error("Username can not be empty!");
          return;
        } else if (this.model.password() === "") {
          notification.error("Password can not be empty!");
          return;
        }

        this.model.errorText(false);
        this.model.loading(true);

        murrix.server.emit("user.save", {
          name: this.model.name(),
          username: this.model.username(),
          password: this.model.password(),
          email: this.model.email(),
          _person: this.model.personId()
        }, function(error, userData) {
          this.model.loading(false);

          if (error) {
            notification.error(error);
            return;
          }

          settings.user(userData);
          notification.success("User created successfully!");
          this.model.personId(false);
          this.model.name("");
          this.model.username("");
          this.model.email("");
          this.model.password("");
        }.bind(this));
      }.bind(this);
    }
  });
});
