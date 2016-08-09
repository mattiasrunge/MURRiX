"use strict";

const ko = require("knockout");
const moment = require("moment");
const api = require("api.io-client");
const utils = require("lib/utils");
const ui = require("lib/ui");
const stat = require("lib/status");

module.exports = utils.wrapComponent(function*(/*params*/) {
    ui.setTitle("News");

    this.date = ko.observable(moment());
    this.loading = stat.create();
    this.list = ko.observableArray();
    this.events = ko.asyncComputed([], function*() {
        this.loading(true);
        let result = yield api.feed.eventThisDay(this.date().format("YYYY-MM-DD"));
        this.loading(false);

        console.log(result);

        return result.map((item) => {
            item.node = ko.observable(item.node);
            return item;
        });
    }.bind(this), (error) => {
        this.loading(false);
        stat.printError(error);
        return [];
    });

    this.nextDay = () => {
        this.date().add(1, "day");
        this.date.valueHasMutated();
    };

    this.prevDay = () => {
        this.date().subtract(1, "day");
        this.date.valueHasMutated();
    };

    this.loading(true);
    let list = [];//yield api.feed.list({ limit: 30 });
    this.loading(false);

    console.log("news", list);

    let filterd = [];
    for (let item of list) {
        let readable = yield api.vfs.access(item.node.attributes.path, "r");

        if (readable) {
            filterd.push(item);
        }
    }

    this.list(filterd.map((item) => {
        item.node = ko.observable(item.node);
        return item;
    }));

    let subscription = api.feed.on("new", (data) => {
        api.vfs.access(data.path, "r")
        .then((readable) => {
            if (readable) {
                this.list.unshift({
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

    this.dispose = () => {
        api.feed.off(subscription);
        stat.destroy(this.loading);
    };
});
