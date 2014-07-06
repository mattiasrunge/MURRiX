
define([
  "zone",
  "text!./index.html",
  "notification",
  "router",
  "knockout",
  "murrix",
  "tools",
  "when"
], function(zone, template, notification, router, ko, murrix, tools, when) {
  return zone({
    template: template,
    route: "/access",
    transition: "entrance-in",
    onInit: function() {
      this.model.type = ko.observable("nodeEdit");
      this.model.title = ko.observable("Access");
      this.model.loading = ko.observable(false);
      this.model.node = murrix.node;
      this.model.admins = ko.observableArray();
      this.model.readers = ko.observableArray();
      this.model.others = ko.observableArray();
  
      var save = function(nodeData) {
        var d = when.defer();
        this.model.loading(true);

        murrix.server.emit("node.save", nodeData, function(error, nodeData) {
          this.model.loading(false);

          if (error) {
            d.reject(error);
            return;
          }

          this.model.node(nodeData);
          
          this.reload().then(function() {
            d.resolve();
          }).catch(function(error) {
            d.reject(error);
          });
        }.bind(this));
          
        return d.promise;
      }.bind(this);
      
      this.model.changePublic = function(flag) {
        var nodeData = this.model.node();

        nodeData.public = flag;

        save(nodeData).then(function() {
          if (flag) {
            notification.success("Successfully made node public!");
          } else {
            notification.success("Successfully made node private!");
          }
        }).catch(function(error) {
          notification.error("Failed to make node public, error:" + error);
        });
      }.bind(this);
      
      this.model.remove = function(data) {
        var nodeData = this.model.node();

        nodeData._readers = nodeData._readers || [];
        nodeData._admins = nodeData._admins || [];

        nodeData._readers = tools.removeFromArray(data._id, nodeData._readers);
        nodeData._admins = tools.removeFromArray(data._id, nodeData._admins);

        save(nodeData).then(function() {
          notification.success("Successfully revoked all rights from " + data.name + "!");
        }).catch(function(error) {
          notification.error("Failed to revoke all rights, error:" + error);
        });
      }.bind(this);
      
      this.model.makeReader = function(data) {
        var nodeData = this.model.node();

        nodeData._readers = nodeData._readers || [];
        nodeData._admins = nodeData._admins || [];

        nodeData._readers = tools.addToArray(data._id, nodeData._readers);
        nodeData._admins = tools.removeFromArray(data._id, nodeData._admins);

        save(nodeData).then(function() {
          notification.success("Successfully made " + data.name + " a reader of this node!");
        }).catch(function(error) {
          notification.error("Failed to grant read rights, error:" + error);
        });
      }.bind(this);
      
      this.model.makeAdmin = function(data) {
        var nodeData = this.model.node();

        nodeData._readers = nodeData._readers || [];
        nodeData._admins = nodeData._admins || [];

        nodeData._readers = tools.removeFromArray(data._id, nodeData._readers);
        nodeData._admins = tools.addToArray(data._id, nodeData._admins);

        save(nodeData).then(function() {
          notification.success("Successfully made " + data.name + " an admin of this node!");
        }).catch(function(error) {
          notification.error("Failed to grant admin rights, error:" + error);
        });
      }.bind(this);
    },
    onLoad: function(d, args) {
      this.model.admins.removeAll();
      this.model.readers.removeAll();
      this.model.others.removeAll();

      var groupIdList = [];

      if (typeof murrix.user().admin === "undefined" || murrix.user().admin !== true) {
        groupIdList = murrix.user()._groups;
        groupIdList = groupIdList.concat(murrix.node()._readers, murrix.node()._admins);
      }

      murrix.server.emit("group.find", { query: { _id: { $in: groupIdList } } }, function(error, groupDataList) {
        if (error) {
          notification.error(error);
          d.reject(error);
          return;
        }

        var listAdmins = [];
        var listReaders = [];
        var listOthers = [];

        for (var n in groupDataList) {
          if (murrix.node()._admins.indexOf(groupDataList[n]._id) !== -1) {
            listAdmins.push(groupDataList[n]);
          } else if (murrix.node()._readers.indexOf(groupDataList[n]._id) !== -1) {
            listReaders.push(groupDataList[n]);
          } else {
            listOthers.push(groupDataList[n]);
          }
        }

        this.model.admins(listAdmins);
        this.model.readers(listReaders);
        this.model.others(listOthers);
        d.resolve();
      }.bind(this));
    }
  });
});
