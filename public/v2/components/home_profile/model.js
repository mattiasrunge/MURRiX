"use strict";

define([
    "text!./template.html",
    "knockout",
    "lib/notification",
    "lib/user"
], function(template, ko, notification, user) {
    return {
        template: template,
        viewModel: function(params) {
            this.loading = notification.loadObservable("component/home_profile", false); // TODO: Dispose!
            this.user = user.user;
        }
    };
});
