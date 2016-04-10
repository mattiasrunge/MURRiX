"use strict";

/* TODO:
 * Homes should have a date interval on them, store as attributes on the symlink
 * Contact information should have icons and emails be clickable etc
 * Add map control to switch between hybrid, terrain, satellite etc
 * Google API key should be placed in a configuration file and the call should be done from serverside
 */

const ko = require("knockout");
const $ = require("jquery");
const api = require("api.io-client");
const utils = require("lib/utils");
const status = require("lib/status");

module.exports = utils.wrapComponent(function*(params) {
    this.node = params.node;
    this.path = params.path;
    this.selectedHome = ko.observable(false);

    this.position = ko.asyncComputed(false, function*() {
        if (!this.selectedHome()) {
            return false;
        }

        let options = {
            address: this.selectedHome().node.attributes.address,
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

    this.homes = ko.asyncComputed(false, function*() {
        let list = yield api.vfs.list(this.path() + "/homes");

        if (list.length > 0) {
            if (!this.selectedHome()) {
                this.selectedHome(list[0]);
            }
        } else {
            this.selectedHome(false);
        }

        return list;
    }.bind(this), (error) => {
        status.printError(error);
        return [];
    });

    this.dispose = () => {
    };
});
