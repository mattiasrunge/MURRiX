"use strict";

/* TODO:
 * Implement timeline
 */

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const session = require("lib/session");
const status = require("lib/status");

module.exports = utils.wrapComponent(function*(params) {
    this.nodepath = ko.pureComputed(() => ko.unwrap(params.nodepath));
    this.loading = status.create();

    this.metrics = ko.asyncComputed([], function*(setter) {
        if (!this.nodepath() || this.nodepath() === "") {
            return {};
        }

        setter({});

        this.loading(true);
        let metrics = yield api.people.getMetrics(this.nodepath().path);
        this.loading(false);

        console.log("metrics", metrics);

        return metrics;
    }.bind(this), (error) => {
        this.loading(false);
        status.printError(error);
        return {};
    });

    this.events = ko.asyncComputed([], function*(setter) {
        if (!this.nodepath() || this.nodepath() === "") {
            return [];
        }

        setter([]);

        this.loading(true);

        let texts = yield api.vfs.list(this.nodepath().path + "/texts");

        utils.sortNodeList(texts);

        console.log("texts", texts);

        return texts;/*




        let days = {};

        for (let text of texts) {
            let day = moment.utc(text.node.attributes.time.timestamp * 1000).format("YYYY-MM-DD");

            days[day] = days[day] || { texts: [], files: [], day: text.node.attributes.time.timestamp };
            days[day].texts.push(text);
        }

        days = Object.keys(days).map((key) => days[key]);

        days.sort((a, b) => {
            return a.day - b.day;
        });

        console.log("days", days);

        return days;*/
    }.bind(this), (error) => {
        this.loading(false);
        status.printError(error);
        return [];
    });

    this.dispose = () => {
        status.destroy(this.loading);
    };
});
