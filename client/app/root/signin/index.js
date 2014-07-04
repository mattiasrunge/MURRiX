
define([
  "zone",
  "router",
  "text!./index.html",
  "knockout",
  "murrix",
  "jquery",
  "jquery-cookie"
], function(zone, router, template, ko, murrix, $, cookie) {
  return zone({
    template: template,
    route: "/signin",
    onInit: function() {
      this.model.username = ko.observable("");
      this.model.password = ko.observable("");
      this.model.rememberMe = ko.observable("");
      this.model.errorText = ko.observable(false);
      this.model.loading = ko.observable(false);

      this.model.submit = function(data) {
        this.model.username($("#signin_username").val());
        this.model.password($("#signin_password").val());
        
        if (this.model.username() === "" || this.model.password() === "") {
          this.model.errorText("Username and password must be entered!");
          return false;
        }

        this.model.errorText(false);
        this.model.loading(true);

        murrix.server.emit("user.login", { username: this.model.username(), password: this.model.password() }, function(error, userData) {
          this.model.loading(false);

          if (error) {
            console.error(error);
            this.model.errorText(error);
            return;
          }

          if (userData === false) {
            this.model.errorText("No such user found!");
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
