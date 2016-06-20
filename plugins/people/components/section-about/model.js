"use strict";

/* TODO:
 * Implement timeline
 */

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const session = require("lib/session");
const status = require("lib/status");

module.exports = utils.wrapComponent(function*(params) {
    this.nodepath = ko.pureComputed(() => ko.unwrap(params.nodepath));
    this.loading = status.create();

    this.metrics = ko.asyncComputed([], function*(setter) {
        if (!this.nodepath() || this.nodepath() === "") {
            return {};
        }

        setter({});

        this.loading(true);
        let metrics = yield api.people.getMetrics(this.nodepath().path);
        this.loading(false);

        console.log("metrics", metrics);

        return metrics;
    }.bind(this), (error) => {
        this.loading(false);
        status.printError(error);
        return {};
    });

    this.dispose = () => {
        status.destroy(this.loading);
    };
});
