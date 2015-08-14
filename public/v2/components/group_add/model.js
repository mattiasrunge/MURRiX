define([
    "text!./template.html",
    "knockout",
    "lib/notification",
    "lib/socket"
], function(template, ko, notification, socket) {
    return {
        template: template,
        viewModel: function(params) {
            this.loading = notification.loadObservable("component/group_add", false); // TODO: Dispose!

            this.name = ko.observable("");
            this.description = ko.observable("");
            this.createHandler = params.create || function() {};

            this.reset = function() {
                this.name("");
                this.description("");
            }.bind(this);

            this.save = function() {
                if (this.name() === "") {
                    notification.error("Name can not be empty!");
                    return;
                }

                this.loading(true);

                socket.emit("saveGroup", {
                    name: this.name(),
                    description: this.description()
                }, function(error, groupData) {
                    this.loading(false);

                    if (error) {
                        notification.error(error);
                        return;
                    }

                    notification.success("Group created successfully!");
                    this.createHandler(groupData);
                    this.reset();
                }.bind(this));
            }.bind(this);

            this.reset();
        }
    };
});
