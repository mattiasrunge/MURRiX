
define([
    "text!./template.html",
    "knockout",
    "lib/notification",
    "lib/socket"
], function(template, ko, notification, socket) {
    return {
        template: template,
        viewModel: function(params) {
            this.user = params.user;
            this.loading = notification.loadObservable("component/user_edit", false); // TODO: Dispose!
            this.updateHandler = params.update || function() {};

            this.personId = ko.observable(false);
            this.name = ko.observable("");
            this.username = ko.observable("");
            this.email = ko.observable("");
            this.password1 = ko.observable("");
            this.password2 = ko.observable("");
            this.groupId = ko.observable(false);

            this.reset = function() {
                this.password1("");
                this.password2("");
                this.groupId(false);

                if (this.user() !== false) {
                    this.personId(this.user()._person);
                    this.name(this.user().name);
                    this.username(this.user().username);
                    this.email(this.user().email);
                } else {
                    this.personId(false);
                    this.name("");
                    this.username("");
                    this.email("");
                }
            }.bind(this);

            this.save = function() {
                if (this.username() === "") {
                    notification.error("Username can not be empty!");
                    return;
                }

                this.loading(true);

                socket.emit("saveUser", {
                    _id: this.user()._id,
                    name: this.name(),
                    username: this.username(),
                    email: this.email(),
                    _person: this.personId(),
                    _groups: this.user()._groups
                }, function(error, userData) {
                    this.loading(false);

                    if (error) {
                        notification.error(error);
                        return;
                    }

                    this.user(userData);
                    notification.success("User saved successfully!");
                    this.updateHandler(userData);
                    this.reset();
                }.bind(this));
            }.bind(this);

            this.changePassword = function() {
                if (this.password1() !== this.password2()) {
                    notification.error("Password does not match!");
                    return;
                } else if (this.password1() === "") {
                    notification.error("Password can not be empty!");
                    return;
                }

                this.loading(true);

                socket.emit("changePassword", {
                    id: this.user()._id,
                    password: this.password1()
                }, function(error, userData) {
                    this.loading(false);

                    if (error) {
                        notification.error(error);
                        return;
                    }

                    notification.success("Password changed successfully!");
                    this.reset();
                }.bind(this));
            }.bind(this);

            var s1 = this.user.subscribe(function() {
                this.reset();
            }.bind(this));

            var s2 = this.groupId.subscribe(function() {
                if (this.groupId()) {
                    this.loading(true);

                    socket.emit("connectUserAndGroup", {
                        userId: this.user()._id,
                        groupId: this.groupId()
                    }, function(error) {
                        this.loading(false);

                        if (error) {
                            notification.error(error);
                            return;
                        }

                        notification.success("Group added successfully!");
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
