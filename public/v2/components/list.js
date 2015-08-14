"use strict";

define([
    "knockout"
], function(ko) {
    var list = [
        "root",
        "login",
        "home",
        "home_recent",
        "home_search",
        "home_year",
        "home_profile",
        "home_users",
        "home_groups",
        "node_list",
        "group_list",
        "group_edit",
        "group_add",
        "group_select",
        "user_list",
        "user_edit",
        "user_add",
        "user_select",
        "node_select"
    ];

    for (var n = 0; n < list.length; n++) {
        ko.components.register(list[n], { require: "components/" + list[n] + "/model" });
    }
});
