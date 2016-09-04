"use strict";

const co = require("bluebird").coroutine;
const api = require("api.io");
const request = require("request-promise-native");

let params = {};

let lookup = api.register("lookup", {
    deps: [ ],
    init: co(function*(config) {
        params = config;
    }),
    getTimezoneFromPosition: function*(session, longitude, latitude) {
        let options = {
            uri: "https://maps.googleapis.com/maps/api/timezone/json",
            qs: {
                location: latitude + "," + longitude,
                timestamp: 0,
                key: params.googleKey
            },
            json: true
        };

        let data = yield request(options);
        /*{
            "dstOffset" : 3600,
            "rawOffset" : 0,
            "status" : "OK",
            "timeZoneId" : "America/New_York",
            "timeZoneName" : "Eastern Standard Time"
        }*/

        if (data.status !== "OK") {
            throw new Error(data.errorMessage);
        }

        return {
            utcOffset: data.rawOffset,
            name: data.timeZoneId
        };
    },
    getAddressFromPosition: function*(session, longitude, latitude) {
        let options = {
            uri: "https://maps.googleapis.com/maps/api/geocode/json",
            qs: {
                sensor: false,
                latlng: latitude + "," + longitude,
                key: params.googleKey
            },
            json: true
        };

        let data = yield request(options);

        if (data.status !== "OK") {
            throw new Error(data.errorMessage);
        } else if (data.results.length === 0) {
            return false;
        }

        return data.results[0].formatted_address; // jshint ignore:line
    },
    getPositionFromAddress: function*(session, address) {
        let options = {
            uri: "https://maps.googleapis.com/maps/api/geocode/json",
            qs: {
                address: address,
                key: params.googleKey
            },
            json: true
        };

        let data = yield request(options);

        if (data.status !== "OK") {
            throw new Error(data.errorMessage);
        } else if (data.results.length === 0) {
            return false;
        }

        return {
            longitude: data.results[0].geometry.location.lng,
            latitude: data.results[0].geometry.location.lat
        };
    }
});

module.exports = lookup;