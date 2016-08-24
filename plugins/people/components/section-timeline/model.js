"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const moment = require("moment");
const utils = require("lib/utils");
const stat = require("lib/status");

module.exports = utils.wrapComponent(function*(params) {
    this.nodepath = ko.pureComputed(() => ko.unwrap(params.nodepath));
    this.loading = stat.create();

    this.events = ko.asyncComputed([], function*(setter) {
        if (!this.nodepath() || this.nodepath() === "") {
            return [];
        }

        setter([]);

        this.loading(true);

        let texts = yield api.vfs.list(this.nodepath().path + "/texts", { checkwritable: true });

        utils.sortNodeList(texts);

        console.log("texts", texts);

        let days = {};

        for (let text of texts) {
            let day = moment.utc(text.node.attributes.time.timestamp * 1000).format("YYYY-MM-DD");

            days[day] = days[day] || { texts: [], day: text.node.attributes.time.timestamp };
            days[day].texts.push(ko.observable({
                path: text.path,
                node: ko.observable(text.node),
                editable: text.editable
            }));
        }

        days = Object.keys(days).map((key) => days[key]);

        days.sort((a, b) => {
            return a.day - b.day;
        });

        console.log("days", days);

        this.loading(false);

        return days;
    }.bind(this), (error) => {
        this.loading(false);
        stat.printError(error);
        return [];
    });

    this.dispose = () => {
        stat.destroy(this.loading);
    };
});
