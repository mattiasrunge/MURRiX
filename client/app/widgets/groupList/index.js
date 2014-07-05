
define([
  "widget",
  "text!./index.html",
  "notification",
  "knockout",
  "murrix"
], function(widget, template, notification, ko, murrix) {
  widget({
    template: template,
    name: "groupList",
    onCreate: function(settings) {
      this.model.groups = ko.observableArray();
      
      murrix.server.emit("group.find", { query: { _id: { $in: settings.idList } } }, function(error, groupDataList) {
        if (error) {
          notification.error(error);
          return;
        }

        var list = [];
        for (var id in groupDataList) {
          list.push(groupDataList[id]);
        }
          
        this.model.groups(list);
      }.bind(this));
    }
  });
});
