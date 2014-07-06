
define([
  "zone",
  "router",
  "text!./index.html",
  "notification",
  "knockout",
  "murrix",
  "jquery",
  "jquery-cookie"
], function(zone, router, template, notification, ko, murrix, $, cookie) {
  return zone({
    template: template,
    route: "/signin",
    transition: "entrance-in-fade",
    onInit: function() {
      this.model.username = ko.observable("");
      this.model.password = ko.observable("");
      this.model.rememberMe = ko.observable("");
      this.model.loading = ko.observable(false);

      this.model.submit = function(data) {
        this.model.username($("#signin_username").val());
        this.model.password($("#signin_password").val());
        
        if (this.model.username() === "" || this.model.password() === "") {
          notification.error("Username and password must be entered!");
          return false;
        }

        this.model.loading(true);

        murrix.server.emit("user.login", { username: this.model.username(), password: this.model.password() }, function(error, userData) {
          this.model.loading(false);

          if (error) {
            notification.error(error);
            return;
          }

          if (userData === false) {
            notification.error("No such user found!");
            return;
          }

          if (this.model.rememberMe() === true) {
            $.cookie("userinfo", JSON.stringify({ username: this.model.username(), password: this.model.password() }), { expires: 365, path: "/" });
          } else {
            $.cookie("userinfo", null, { path: "/" });
          }

          murrix.user(userData);

          router.reload();
        }.bind(this));
        
        return false;
      }.bind(this);
    },
    onLoad: function(d, args) {
      if (murrix.user() !== false) {
        d.resolve({ "redirect": "/" });
        return;
      }
      
      d.resolve();
    }
  });
});
