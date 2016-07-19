"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const status = require("lib/status");

module.exports = utils.wrapComponent(function*(params) {
    this.nodepath = params.nodepath;
    this.section = params.section;

    this.position = ko.asyncComputed(false, function*() {
        if (!this.nodepath()) {
            return false;
        }

        let options = {
            address: this.nodepath().node().attributes.address,
            key: "AIzaSyCSEsNChIm5df-kICUgXZLvqGRT9N_dUUY"
        };

        let data = yield new Promise((resolve) => {
            jQuery.getJSON("https://maps.googleapis.com/maps/api/geocode/json", options, resolve);
        });

        if (data.status !== "OK" || data.results.length === 0) {
            return false;
        }

        return {
            longitude: data.results[0].geometry.location.lng,
            latitude: data.results[0].geometry.location.lat
        };
    }.bind(this), (error) => {
        status.printError(error);
        return false;
    });

    this.residents = ko.asyncComputed([], function*(setter) {
        if (!this.nodepath()) {
            return [];
        }

        setter([]);
        return yield api.vfs.list(this.nodepath().path + "/residents");
    }.bind(this), (error) => {
        status.printError(error);
        return [];
    });

    this.dispose = () => {
    };
});
