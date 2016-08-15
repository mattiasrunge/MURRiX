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

        if (!this.item().attributes.address) {
            return false;
        }

        let options = {
            address: this.item().attributes.address.replace("<br>", "\n"),
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

    this.item = ko.asyncComputed(false, function*(setter) {
        if (!this.nodepath()) {
            return false;
        }

        setter(false);

        this.loading(true);
        let item = yield api.vfs.resolve(this.nodepath().node().attributes.path, { noerror: true });
        this.loading(false);

        console.log("item", item);

        return item;
    }.bind(this), (error) => {
        this.loading(false);
        stat.printError(error);
        return false;
    });

    let subscription = api.vfs.on("update", (data) => {
        if (data.path !== this.nodepath().node().attributes.path) {
            return;
        }

        this.item.reload();
    });

    this.dispose = () => {
        api.vfs.off(subscription);
        stat.destroy(this.loading);
    };
});
