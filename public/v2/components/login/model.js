"use strict";

define([
    "text!./template.html",
    "knockout",
    "lib/user"
], function(template, ko, user) {
    return {
        template: template,
        viewModel: function(params) {
            this.username = ko.observable("");
            this.password = ko.observable("");
            this.rememberMe = ko.observable("");
            this.loading = user.loading;

            this.submit = function(data) {
//                 this.username($("#signin_username").val());
//                 this.password($("#signin_password").val());
                user.login(ko.unwrap(this.username), ko.unwrap(this.password));
/*
                if (this.username() === "" || this.password() === "") {
                    notification.error("Username and password must be entered!");
                    return false;
                }

                this.loading(true);

                socket.emit("login", { username: this.username(), password: this.password() }, function(error, userData) {
                    this.loading(false);

                    if (error) {
                        notification.error(error);
                        return;
                    }

                    if (userData === false) {
                        notification.error("No such user found!");
                        return;
                    }

    //                 if (this.rememberMe() === true) {
    //                     $.cookie("userinfo", JSON.stringify({ username: this.username(), password: this.password() }), { expires: 365, path: "/" });
    //                 } else {
    //                     $.cookie("userinfo", null, { path: "/" });
    //                 }

                    murrix.user(userData);
                }.bind(this));*/

                return false;
            }.bind(this);
        }
    };
});
