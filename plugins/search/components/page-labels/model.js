"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const loc = require("lib/location");
const ui = require("lib/ui");
const stat = require("lib/status");
const session = require("lib/session");

model.loading = stat.create();
model.query = ko.pureComputed({
    read: () => ko.unwrap(loc.current().query) || "",
    write: (value) => loc.goto({ query: value })
});
model.list = ko.asyncComputed([], function*() {
    if (model.query().length < 4) {
        return [];
    }

    let labels = model.query().split("+");

    if (labels.length === 0) {
        return [];
    }

    let query = {
        "attributes.labels": { $in: labels }
    };

    model.loading(true);

    let list = yield api.vfs.list(session.searchPaths(), { filter: query });

    model.loading(false);

    ui.setTitle("Search for " + model.query());

    return list.map((item) => {
        item.node = ko.observable(item.node);
        return item;
    });
}, (error) => {
    model.loading(false);
    stat.printError(error);
    return [];
}, { rateLimit: { timeout: 500, method: "notifyWhenChangesStop" } });

model.labels = ko.asyncComputed([], function*() {
    return yield api.vfs.labels();
}, (error) => {
    model.loading(false);
    stat.printError(error);
    return [];
}, { rateLimit: { timeout: 500, method: "notifyWhenChangesStop" } });

ui.setTitle("Search");

const dispose = () => {
    stat.destroy(model.loading);
};
