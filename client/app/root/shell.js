
define([
  "zone",
  "notification",
  "router",
  "text!./shell.html",
  "./home/index",
  "./signin/index",
  "ko-ext",
  "moment",
  "murrix",
  "jquery",
  "jquery-cookie"
], function(zone, notification, router, template, ZoneHome, ZoneSignin, ko, moment, murrix, $, cookie) {
  var nodeId = ko.observable(false);

  nodeId.subscribe(function(value) {
    if (value && value !== murrix.nodeId()) {
      router.navigateTo("/node/" + value);
    }
  });
  
  murrix.nodeId.subscribe(function(value) {
    nodeId(value);
  });

  return zone({
    template: template,
    zones: [ ZoneSignin, ZoneHome ],
    onInit: function() {
      this.model.user = murrix.user;
      this.model.userNode = murrix.userNode;
      this.model.loading = router.isNavigating;
      this.model.nodeId = nodeId;
      this.model.item = murrix.item;
      this.model.nodeIdRaw = ko.observable(false);
      
      this.model.randomNode = function() {
        murrix.server.emit("node.random", {}, function(error, nodeData) {
          if (error) {
            notification.error(error);
            return;
          }

          router.navigateTo("node/" + nodeData._id);
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
    }
//     activate: function()
//     {
//       router.map([
//         { route: ["", "murrix*details"],                            moduleId: "root/murrix/index",          nav: true, hash: "#murrix" },
//         { route: "node/:id*details",        title: "Node",          moduleId: "root/node/index",            nav: true, hash: "#node/:id" },
//         { route: "signin",                  title: "Sign in",       moduleId: "root/signin/index",          nav: true },
//       ]);
// 
//       router.mapUnknownRoutes("root/notfound/index", "");
//       router.buildNavigationModel();
// 
//       return router.activate();
//     },
   
  });
});
