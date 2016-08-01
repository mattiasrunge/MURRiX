"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const loc = require("lib/location");
const ui = require("lib/ui");
const stat = require("lib/status");

module.exports = utils.wrapComponent(function*(/*params*/) {
    this.loading = stat.create();
    this.year = ko.pureComputed({
        read: () => parseInt(ko.unwrap(loc.current().year), 10) || new Date().getFullYear(),
        write: (value) => loc.goto( { year: value })
    });
    this.list = ko.asyncComputed([], function*(setter) {
        setter([]);

        this.loading(true);

        let list = yield api.album.findByYear(this.year());

        this.loading(false);

        return list.map((item) => {
            item.node = ko.observable(item.node);
            return item;
        });
    }.bind(this), (error) => {
        this.loading(false);
        stat.printError(error);
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
        stat.destroy(this.loading);
    };
});
