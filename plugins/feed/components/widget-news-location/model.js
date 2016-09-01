"use strict";

const ko = require("knockout");
const $ = require("jquery");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");

module.exports = utils.wrapComponent(function*(params) {
    this.loading = stat.create();
    this.nodepath = ko.pureComputed(() => ko.unwrap(params.nodepath));

    this.position = ko.asyncComputed(false, function*() {
        if (!this.item()) {
            return false;
        }

        if (!this.item().node().attributes.address) {
            return false;
        }

        let options = {
            address: this.item().node().attributes.address.replace("<br>", "\n"),
            key: "AIzaSyCSEsNChIm5df-kICUgXZLvqGRT9N_dUUY"
        };

        let data = yield new Promise((resolve) => {
            $.getJSON("https://maps.googleapis.com/maps/api/geocode/json", options, resolve);
        });

        if (data.status !== "OK" || data.results.length === 0) {
            return false;
        }

        return {
            longitude: data.results[0].geometry.location.lng,
            latitude: data.results[0].geometry.location.lat
        };
    }.bind(this), (error) => {
        stat.printError(error);
        return false;
    });

    this.itemPath = ko.pureComputed(() => this.nodepath() ? this.nodepath().node().attributes.path : false);
    this.item = ko.nodepath(this.itemPath, { noerror: true });

    this.dispose = () => {
        this.item.dispose();
        stat.destroy(this.loading);
    };
});
