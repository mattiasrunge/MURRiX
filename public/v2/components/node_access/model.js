"use strict";

define([
    "text!./template.html",
    "knockout",
    "lib/socket",
    "lib/notification",
    "lib/user",
    "lib/tools"
], function(template, ko, socket, notification, user, tools) {
    return {
        template: template,
        viewModel: function(params) {
            this.loading = notification.loadObservable("component/node_access", false); // TODO: Dispose!
            this.list = ko.observableArray();
            this.node = ko.pureComputed(function() {
                return ko.unwrap(params.node);
            });

            this.load = function() {
                if (this.node() && user.user()) {
                    var groupIdList = [];

                    if (!user.user().admin) {
                        groupIdList = [].concat(user.user()._groups, this.node()._readers, this.node()._admins);
                    }

                    this.loading(true);

                    socket.emit("findGroups", { }, function(error, groupDataList) {
                        this.loading(false);

                        if (error) {
                            notification.error(error);
                            return;
                        }

                        groupDataList = Object.keys(groupDataList).map(function(id) {
                            return groupDataList[id];
                        });

                        console.log("group result", groupDataList);

                        var list = (groupDataList.map(function(group) {
                            var data = {
                                id: group._id,
                                name: group.name,
                                description: group.description,
                                admin: this.node()._admins.indexOf(group._id) !== -1,
                                reader: this.node()._readers.indexOf(group._id) !== -1
                            };

                            data.noaccess = !data.admin && !data.reader;

                            return data;
                        }.bind(this)));

                        list.push({
                            id: 0,
                            name: "Everyone",
                            description: "Public, for everyone not logged in",
                            admin: false,
                            reader: this.node().public,
                            noaccess: !this.node().public
                        });

                        list.sort(function(a, b) {
                            return a.name.localeCompare(b.name);
                        });

                        this.list(list);
                    }.bind(this));
                }
            }.bind(this);

            this.save = function(nodeData) {
                this.loading(true);

                socket.emit("saveNode", nodeData, function(error, nodeData) {
                    this.loading(false);

                    if (error) {
                        notification.error(error);
                        return;
                    }

                    params.node(nodeData);
                }.bind(this));
            };

            this.removeAccess = function(data) {
                var nodeData = this.node();

                if (data.id === 0) {
                    nodeData.public = false;
                } else {
                    nodeData._readers = tools.removeFromArray(data.id, nodeData._readers);
                    nodeData._admins = tools.removeFromArray(data.id, nodeData._admins);
                }

                this.save(nodeData);
            }.bind(this);

            this.adminAccess = function(data) {
                var nodeData = this.node();

                if (data.id === 0) {
                    console.log("Can not give the public admin access.");
                    return;
                } else {
                    nodeData._readers = tools.removeFromArray(data.id, nodeData._readers);
                    nodeData._admins = tools.addToArray(data.id, nodeData._admins);
                }

                this.save(nodeData);
            }.bind(this);

            this.readAccess = function(data) {
                var nodeData = this.node();

                if (data.id === 0) {
                    nodeData.public = true;
                } else {
                    nodeData._readers = tools.addToArray(data.id, nodeData._readers);
                    nodeData._admins = tools.removeFromArray(data.id, nodeData._admins);
                }

                this.save(nodeData);
            }.bind(this);

            var s = this.node.subscribe(this.load);
            this.load();

            this.dispose = function() {
                s.dispose();
            };
        }
    };
});
