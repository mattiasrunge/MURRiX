"use strict";

const ko = require("knockout");
const $ = require("jquery");
const api = require("api.io-client");
const moment = require("moment");
const utils = require("lib/utils");
const stat = require("lib/status");

model.nodepath = ko.pureComputed(() => ko.unwrap(params.nodepath));
model.loading = stat.create();

model.texts = ko.asyncComputed([], async (setter) => {
    if (!model.nodepath() || model.nodepath() === "") {
        return [];
    }

    params.reload();

    setter([]);

    model.loading(true);

    let texts = await api.vfs.list(model.nodepath().path + "/texts", { checkwritable: true });

    utils.sortNodeList(texts);

    console.log("texts", texts);

    let list = [];

    for (let text of texts) {
        let paths = await api.vfs.lookup(text.node._id);
        let withPaths = paths.filter((path) => path !== text.path).map((path) => path.split("/", 3).join("/"));

        list.push(ko.observable({
            path: text.path,
            node: ko.observable(text.node),
            editable: text.editable,
            withPaths: withPaths
        }));
    }

    model.loading(false);

    return list;
}, (error) => {
    model.loading(false);
    stat.printError(error);
    return [];
});

model.events = ko.asyncComputed([], async (setter) => {
    if (!model.nodepath() || model.nodepath() === "") {
        return [];
    }

    params.reload();

    setter([]);

    model.loading(true);

    let texts = await api.vfs.list(model.nodepath().path + "/texts", { checkwritable: true });

    utils.sortNodeList(texts);

    console.log("texts", texts);

    let days = {};

    for (let text of texts) {
        let day = moment.utc(text.node.attributes.time.timestamp * 1000).format("YYYY-MM-DD");

        let paths = await api.vfs.lookup(text.node._id);
        let withPaths = paths.filter((path) => path !== text.path).map((path) => path.split("/", 3).join("/"));

        days[day] = days[day] || { texts: [], day: text.node.attributes.time.timestamp };
        days[day].texts.push(ko.observable({
            path: text.path,
            node: ko.observable(text.node),
            editable: text.editable,
            withPaths: withPaths
        }));
    }

    days = Object.keys(days).map((key) => days[key]);

    days.sort((a, b) => {
        return a.day - b.day;
    });

    console.log("days", days);

    model.loading(false);

    return days;
}, (error) => {
    model.loading(false);
    stat.printError(error);
    return [];
});

model.createShow = () => {
    $("#createPeopleEventModal").modal("show");
};

const dispose = () => {
    stat.destroy(model.loading);
};
