﻿"use strict";

/* TODO:
 * Implement comments
 * Implement timeline
 * Implement labels
 * Use real images in mosaic
 */

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const session = require("lib/session");
const status = require("lib/status");

module.exports = utils.wrapComponent(function*(params) {
    this.node = params.node;
    this.path = params.path;

    this.position = ko.asyncComputed(false, function*() {
        if (!this.node()) {
            return false;
        }

        let options = {
            address: this.node().attributes.address,
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
        setter([]);
        return yield api.vfs.list(ko.unwrap(this.path) + "/residents");
    }.bind(this), (error) => {
        status.printError(error);
        return [];
    });

    this.dispose = () => {
//         subscription.dispose();
    };
});
