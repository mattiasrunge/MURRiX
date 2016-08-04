"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const ui = require("lib/ui");
const stat = require("lib/status");

module.exports = utils.wrapComponent(function*(/*params*/) {
    ui.setTitle("News");

    this.loading = stat.create();
    this.list = ko.observableArray();

    this.loading(true);
    let list = yield api.feed.list({ limit: 30 });
    this.loading(false);

    console.log("news", list);

    this.list(list.map((item) => {
        item.node = ko.observable(item.node);
        return item;
    }));

    let subscription = api.feed.on("new", (data) => {
        this.list.unshift({
            name: data.name,
            path: data.path,
            node: ko.observable(data.node)
        });
    });

    this.dispose = () => {
        api.feed.off(subscription);
        stat.destroy(this.loading);
    };
});
