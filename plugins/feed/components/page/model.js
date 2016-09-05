"use strict";

const ko = require("knockout");
const moment = require("moment");
const api = require("api.io-client");
const utils = require("lib/utils");
const ui = require("lib/ui");
const stat = require("lib/status");

module.exports = utils.wrapComponent(function*(/*params*/) {
    ui.setTitle("News");

    this.today = ko.observable(moment());
    this.tomorrow = ko.pureComputed(() => this.today().clone().add(1, "day"));
    this.loading = stat.create();
    this.list = ko.observableArray();
    this.eventsToday = ko.asyncComputed([], function*() {
        this.loading(true);
        let result = yield api.feed.eventThisDay(this.today().format("YYYY-MM-DD"));
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

    this.eventsTomorrow = ko.asyncComputed([], function*() {
        this.loading(true);
        let result = yield api.feed.eventThisDay(this.tomorrow().format("YYYY-MM-DD"));
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
        this.today().add(1, "day");
        this.today.valueHasMutated();
    };

    this.prevDay = () => {
        this.today().subtract(1, "day");
        this.today.valueHasMutated();
    };

    this.loading(true);
    let list = yield api.feed.list();
    this.loading(false);

    console.log("news", list);

    let filtered = [];
    for (let item of list) {
        let readable = yield api.vfs.access(item.node.attributes.path, "r");

        if (readable) {
            filtered.push(item);
        }
    }

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

    const delayAdd = (item) => {
        return new Promise((resolve) => {
            item.node = ko.observable(item.node);

            this.list.push(item);

            setTimeout(resolve, 300);
        });
    };

    for (let item of filtered) {
        yield delayAdd(item);
    }

    this.dispose = () => {
        api.feed.off(subscription);
        stat.destroy(this.loading);
    };
});
