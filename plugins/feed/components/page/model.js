"use strict";

const ko = require("knockout");
const moment = require("moment");
const api = require("api.io-client");
const utils = require("lib/utils");
const ui = require("lib/ui");
const stat = require("lib/status");

ui.setTitle("News");

model.today = ko.observable(moment());
model.tomorrow = ko.pureComputed(() => model.today().clone().add(1, "day"));
model.loading = stat.create();
model.list = ko.observableArray();
model.eventsToday = ko.asyncComputed([], async () => {
    model.loading(true);
    let result = await api.feed.eventThisDay(model.today().format("YYYY-MM-DD"));
    model.loading(false);

    console.log(result);

    return result.map((item) => {
        item.node = ko.observable(item.node);
        return item;
    });
}, (error) => {
    model.loading(false);
    stat.printError(error);
    return [];
});

model.eventsTomorrow = ko.asyncComputed([], async () => {
    model.loading(true);
    let result = await api.feed.eventThisDay(model.tomorrow().format("YYYY-MM-DD"));
    model.loading(false);

    console.log(result);

    return result.map((item) => {
        item.node = ko.observable(item.node);
        return item;
    });
}, (error) => {
    model.loading(false);
    stat.printError(error);
    return [];
});

model.nextDay = () => {
    model.today().add(1, "day");
    model.today.valueHasMutated();
};

model.prevDay = () => {
    model.today().subtract(1, "day");
    model.today.valueHasMutated();
};

model.loading(true);
let list = await api.feed.list();
model.loading(false);

console.log("news", list);

let filtered = [];
for (let item of list) {
    let readable = await api.vfs.access(item.node.attributes.path, "r");

    if (readable) {
        item.node = ko.observable(item.node);
        filtered.push(item);
    }
}

model.list(filtered);

let subscription = api.feed.on("new", (data) => {
    api.vfs.access(data.path, "r")
    .then((readable) => {
        if (readable) {
            model.list.unshift({
                name: data.name,
                path: data.path,
                node: ko.observable(data.node)
            });
        }
    })
    .catch((error) => {
        console.error(error);
    });
});

const dispose = () => {
    api.feed.off(subscription);
    stat.destroy(model.loading);
};
