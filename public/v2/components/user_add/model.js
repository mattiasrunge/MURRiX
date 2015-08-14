
define([
    "text!./template.html",
    "knockout",
    "lib/notification",
    "lib/socket"
], function(template, ko, notification, socket) {
    return {
        template: template,
        viewModel: function(params) {
            this.loading = notification.loadObservable("component/user_add", false); // TODO: Dispose!
            this.createHandler = params.create || function() {};

            this.personId = ko.observable(false);
            this.name = ko.observable("");
            this.username = ko.observable("");
            this.email = ko.observable("");
            this.password = ko.observable("");

            this.reset = function() {
                this.password("");
                this.personId(false);
                this.name("");
                this.username("");
                this.email("");
            }.bind(this);

            this.save = function() {
                if (this.username() === "") {
                    notification.error("Username can not be empty!");
                    return;
                }

                this.loading(true);

                socket.emit("saveUser", {
                    name: this.name(),
                    username: this.username(),
                    passowrd: this.password(),
                    email: this.email(),
                    _person: this.personId()
                }, function(error, userData) {
                    this.loading(false);

                    if (error) {
                        notification.error(error);
                        return;
                    }

                    notification.success("User created successfully!");
                    this.createHandler(userData);
                    this.reset();
                }.bind(this));
            }.bind(this);

            this.reset();
        }
    };
});
