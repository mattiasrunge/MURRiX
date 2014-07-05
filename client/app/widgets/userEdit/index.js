
define([
  "widget",
  "text!./index.html",
  "notification",
  "knockout",
  "murrix"
], function(widget, template, notification, ko, murrix) {
  widget({
    template: template,
    name: "userEdit",
    onCreate: function(settings) {
      this.model.user = settings.user;
      this.model.loading = settings.loading;

      this.model.personId = ko.observable(false);
      this.model.name = ko.observable("");
      this.model.username = ko.observable("");
      this.model.email = ko.observable("");
      this.model.password1 = ko.observable("");
      this.model.password2 = ko.observable("");

      this.subscriptions.push(this.model.user.subscribe(function() {
        this.model.reset();
      }.bind(this)));

      this.model.reset = function() {
        this.model.password1("");
        this.model.password2("");

        if (this.model.user() !== false) {
          this.model.personId(this.model.user()._person);
          this.model.name(this.model.user().name);
          this.model.username(this.model.user().username);
          this.model.email(this.model.user().email);
        } else {
          this.model.personId(false);
          this.model.name("");
          this.model.username("");
          this.model.email("");
        }
      }.bind(this);

      this.model.save = function() {
        if (this.model.username() === "") {
          notification.error("Username can not be empty!");
          return;
        }

        this.model.loading(true);

        murrix.server.emit("user.saveProfile", {
          name: this.model.name(),
          username: this.model.username(),
          email: this.model.email(),
          _person: this.model.personId()
        }, function(error, userData) {
          this.model.loading(false);

          if (error) {
            this.model.errorText(error);
            return;
          }

          this.model.user(userData);
          notification.success("Profile saved successfully!");
        }.bind(this));
      }.bind(this);

      this.model.changePassword = function() {
        if (this.model.password1() !== this.model.password2()) {
          notification.error("Password does not match!");
          return;
        } else if (this.model.password1() === "") {
          notification.error("Password can not be empty!");
          return;
        }

        this.model.loading(true);

        murrix.server.emit("user.changePassword", {
          password: this.model.password1()
        }, function(error, userData) {
          this.model.loading(false);

          if (error) {
            notification.error(error);
            return;
          }

          this.model.user(userData);
          notification.success("Password changed successfully!");
        }.bind(this));
      }.bind(this);

      this.model.reset();
    }
  });
});
