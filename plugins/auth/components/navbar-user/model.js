"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const status = require("lib/status");

module.exports = utils.wrapComponent(function*(params) {
    this.user = ko.observable(false);
//     this.response = ko.observable(false);
//
//     // TODO: temp
//     let result = yield api.vfs.list("/");
//     console.log("result", result);
//     this.response(JSON.stringify(result, null, 2));
//
//     api.message.on("new", function*(message) {
//         this.response(JSON.stringify(message, null, 2));
//
//         let name = yield api.auth.uname(message.attributes.from);
//         console.log(message.attributes.from, name);
//
//         status.printSuccess("Got message from " + name);
//     }.bind(this));
});
