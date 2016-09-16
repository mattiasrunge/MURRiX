"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const loc = require("lib/location");
const ui = require("lib/ui");
const stat = require("lib/status");

model.loading = stat.create();
model.year = ko.pureComputed({
    read: () => parseInt(ko.unwrap(loc.current().year), 10) || new Date().getFullYear(),
    write: (value) => loc.goto({ year: value })
});
model.list = ko.asyncComputed([], function*(setter) {
    setter([]);

    model.loading(true);

    let list = yield api.search.findByYear(model.year());

    model.loading(false);

    ui.setTitle("Browsing " + model.year());

    return list.map((item) => {
        item.node = ko.observable(item.node);
        return item;
    });
}, (error) => {
    model.loading(false);
    stat.printError(error);
    return [];
}, { rateLimit: { timeout: 500, method: "notifyWhenChangesStop" } });

model.yearIncClicked = () => {
    model.year(model.year() + 1);
};

model.yearDecClicked = () => {
    model.year(model.year() - 1);
};

ui.setTitle("Browse year");

const dispose = () => {
    stat.destroy(model.loading);
};
