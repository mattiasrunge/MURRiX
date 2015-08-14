
define([
    "text!./template.html",
    "knockout",
    "lib/notification",
    "lib/socket"
], function(template, ko, notification, socket) {
    return {
        template: template,
        viewModel: function(params) {
            this.group = params.group;
            this.loading = notification.loadObservable("component/group_edit", false); // TODO: Dispose!

            this.name = ko.observable("");
            this.description = ko.observable("");
            this.userId = ko.observable(false);
            this.updateHandler = params.update || function() {};

            this.reset = function() {
                this.userId(false);

                if (this.group() !== false) {
                    this.name(this.group().name);
                    this.description(this.group().description);
                } else {
                    this.name("");
                    this.description("");
                }
            }.bind(this);

            this.save = function() {
                if (this.name() === "") {
                    notification.error("Name can not be empty!");
                    return;
                }

                this.loading(true);

                socket.emit("saveGroup", {
                    _id: this.group()._id,
                    name: this.name(),
                    description: this.description()
                }, function(error, groupData) {
                    this.loading(false);

                    if (error) {
                        notification.error(error);
                        return;
                    }

                    this.group(groupData);
                    notification.success("Group saved successfully!");
                    this.updateHandler(groupData);
                    this.reset();
                }.bind(this));
            }.bind(this);


            var s1 = this.group.subscribe(function() {
                this.reset();
            }.bind(this));

            var s2 = this.userId.subscribe(function() {
                if (this.userId()) {
                    this.loading(true);

                    socket.emit("connectUserAndGroup", {
                        userId: this.userId(),
                        groupId: this.group()._id
                    }, function(error) {
                        this.loading(false);

                        if (error) {
                            notification.error(error);
                            return;
                        }

                        notification.success("User added successfully!");
                        this.updateHandler();
                        this.reset();
                    }.bind(this));
                }
            }.bind(this));

            this.reset();

            this.dispose = function() {
                s1.dispose();
                s2.dispose();
            };
        }
    };
});

