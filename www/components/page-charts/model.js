"use strict";

const ko = require("knockout");
const moment = require("moment");
const api = require("api.io-client");
const utils = require("lib/utils");
const ui = require("lib/ui");
const stat = require("lib/status");

module.exports = utils.wrapComponent(function*(/*params*/) {
    this.loading = stat.create();

    this.data = ko.asyncComputed([], function*(setter) {
        setter(false);

        this.loading(true);
        let result = yield api.statistics.getEventData();
        this.loading(false);

        let data = [
            {
                label: "Births each month",
                labels: moment.monthsShort(),
                data: result.birth
            },
            {
                label: "Engagements each month",
                labels: moment.monthsShort(),
                data: result.engagement
            },
            {
                label: "Marriages each month",
                labels: moment.monthsShort(),
                data: result.marriage
            },
            {
                label: "Deaths each month",
                labels: moment.monthsShort(),
                data: result.death
            }
        ];

        console.log("event data", result, data);

        return data;
    }.bind(this), (error) => {
        this.loading(false);
        stat.printError(error);
        return false;
    });

    ui.setTitle("Charts");

    this.dispose = () => {
        stat.destroy(this.loading);
    };
});
