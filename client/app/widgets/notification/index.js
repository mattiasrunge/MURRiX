
define([
  "widget",
  "text!./index.html",
  "knockout",
  "notification"
], function(widget, template, ko, notification) {
  widget({
    template: template,
    name: "notification",
    onCreate: function(settings) {
      this.model.messages = notification.messages;
      
      this.model.close = function(message) {
        notification.close(message);
      };
    }
  });
});
