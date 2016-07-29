"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const loc = require("lib/location");
const ui = require("lib/ui");
const status = require("lib/status");
const session = require("lib/session");

module.exports = utils.wrapComponent(function*(params) {
    this.loading = status.create();
    this.year = ko.pureComputed({
        read: () => parseInt(ko.unwrap(loc.current().year), 10) || new Date().getFullYear(),
        write: (value) => loc.goto( { year: value })
    });
    this.list = ko.asyncComputed([], function*(setter) {
        setter([]);

        this.loading(true);
console.log(this.year());
        let list = yield api.album.findByYear(this.year());

        this.loading(false);

        return list.map((item) => {
            item.node = ko.observable(item.node);
            return item;
        });
    }.bind(this), (error) => {
        this.loading(false);
        status.printError(error);
        return [];
    }, { rateLimit: { timeout: 500, method: "notifyWhenChangesStop" } });

    this.yearIncClicked = () => {
        this.year(this.year() + 1);
    };

    this.yearDecClicked = () => {
        this.year(this.year() - 1);
    };

    ui.setTitle("Search");

    this.dispose = () => {
        status.destroy(this.loading);
    };
});
