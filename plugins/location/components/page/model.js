"use strict";

const ko = require("knockout");
const $ = require("jquery");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");

module.exports = utils.wrapComponent(function*(params) {
    this.nodepath = params.nodepath;
    this.section = params.section;

    this.position = ko.asyncComputed(false, function*() {
        if (!this.nodepath()) {
            return false;
        }

        if (!this.nodepath().node().attributes.address) {
            return false;
        }

        let options = {
            address: this.nodepath().node().attributes.address.replace("<br>", "\n"),
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

    this.residents = ko.asyncComputed([], function*(setter) {
        if (!this.nodepath()) {
            return [];
        }

        setter([]);
        return yield api.vfs.list(this.nodepath().path + "/residents");
    }.bind(this), (error) => {
        stat.printError(error);
        return [];
    });

    this.dispose = () => {
    };
});
