
define([
  "zone",
  "text!./index.html",
  "notification",
  "knockout",
  "murrix"
], function(zone, template, notification, ko, murrix) {
  return zone({
    template: template,
    route: "/overview",
    transition: "entrance-in",
    onInit: function() {
      this.model.loading = ko.observable(false);
      this.model.commentText = ko.observable("");
      this.model.node = murrix.node;
      this.model.user = murrix.user;
      this.model.title = ko.observable("Overview");
      this.model.type = ko.observable("node");
      
      this.model.submitComment = function() {
        if (this.model.commentText() === "") {
          notification.error("Can not submit an empty comment.");
          return;
        }
        
        this.model.loading(true);
        
        murrix.server.emit("node.comment", { _id: murrix.node()._id, text: this.model.commentText() }, function(error, nodeData) {
          this.model.loading(false);
          
          if (error) {
            notification.error(error);
            return;
          }
          
          this.model.commentText("");

          murrix.node(nodeData);
        }.bind(this));
      }.bind(this);
    }
  });
});
