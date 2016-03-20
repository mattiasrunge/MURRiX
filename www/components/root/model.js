"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const Bluebird = require("bluebird");
const co = Bluebird.coroutine;

module.exports = function() {
    this.response = ko.observable(false);


    // TODO: temp
    let init = co(function*() {
        let result = yield api.vfs.list("/");
        console.log("result", result);
        this.response(JSON.stringify(result, null, 2));
    }.bind(this));

    init();


    api.message.on("new", function*(message) {
        this.response(JSON.stringify(message, null, 2));
    }.bind(this));
};
