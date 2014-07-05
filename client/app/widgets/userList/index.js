
define([
  "widget",
  "text!./index.html",
  "notification",
  "knockout",
  "murrix"
], function(widget, template, notification, ko, murrix) {
  widget({
    template: template,
    name: "userList",
    onCreate: function(settings) {
      this.model.users = ko.observableArray();
      
      murrix.server.emit("user.find", { query: { _groups: settings.groupId } }, function(error, userDataList) {
        if (error) {
          notification.error(error);
          return;
        }

        var list = [];
        for (var id in userDataList) {
          list.push(userDataList[id]);
        }
          
        this.model.users(list);
      }.bind(this));
    }
  });
});
