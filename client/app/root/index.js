
define([
  "zone",
  "notification",
  "router",
  "text!./index.html",
  "./home/index",
  "./signin/index",
  "./node/index",
  "ko-ext",
  "moment",
  "murrix",
  "jquery",
  "jquery-cookie"
], function(zone, notification, router, template, ZoneHome, ZoneSignin, ZoneNode, ko, moment, murrix, $, cookie) {
  return zone({
    template: template,
    zones: [ ZoneSignin, ZoneHome, ZoneNode ],
    onInit: function() {
      this.model.user = murrix.user;
      this.model.userNode = murrix.userNode;
      this.model.loading = router.isNavigating;
      this.model.nodeId = ko.observable(false);
      this.model.item = murrix.item;
      this.model.nodeIdRaw = ko.observable(false);
      
      this.model.randomNode = function() {
        murrix.server.emit("node.random", {}, function(error, nodeData) {
          if (error) {
            notification.error(error);
            return;
          }

          router.navigateTo("/node/" + nodeData._id);
          return;
        });
      }.bind(this);
      
      this.model.signout = function() {
        murrix.server.emit("user.logout", {}, function(error) {
          $.cookie("userinfo", null, { path: "/" });
          murrix.user(false);
          
          router.reload();
        });
      }.bind(this);
      
      this.model.nodeId.subscribe(function(value) {
        if (value && value !== murrix.nodeId()) {
          router.navigateTo("/node/" + value);
        }
      });
      
      murrix.nodeId.subscribe(function(value) {
        this.model.nodeId(value);
      }.bind(this));
    }
  });
});
