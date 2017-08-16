"use strict";

const api = require("api.io");
const request = require("request-promise-native");

let params = {};

const lookup = api.register("lookup", {
    deps: [ ],
    init: async (config) => {
        params = config;
    },
    getTimezoneFromPosition: api.export(async (session, longitude, latitude) => {
        let options = {
            uri: "https://maps.googleapis.com/maps/api/timezone/json",
            qs: {
                location: latitude + "," + longitude,
                timestamp: 0,
                key: params.googleServerKey
            },
            json: true
        };

        let data = await request(options);
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
    }),
    getAddressFromPosition: api.export(async (session, longitude, latitude) => {
        let options = {
            uri: "https://maps.googleapis.com/maps/api/geocode/json",
            qs: {
                sensor: false,
                latlng: latitude + "," + longitude,
                key: params.googleServerKey
            },
            json: true
        };

        let data = await request(options);

        if (data.status !== "OK") {
            throw new Error(data.errorMessage);
        } else if (data.results.length === 0) {
            return false;
        }

        return data.results[0].formatted_address; // jshint ignore:line
    }),
    getPositionFromAddress: api.export(async (session, address) => {
        return { latitude: 57.66006619999999, longitude: 11.879761 }; // TEMP
        let options = {
            uri: "https://maps.googleapis.com/maps/api/geocode/json",
            qs: {
                address: address,
                key: params.googleServerKey
            },
            json: true
        };

        let data = await request(options);

        if (data.status !== "OK") {
            throw new Error(data.errorMessage);
        } else if (data.results.length === 0) {
            return false;
        }

        return {
            longitude: data.results[0].geometry.location.lng,
            latitude: data.results[0].geometry.location.lat
        };
    })
});

module.exports = lookup;
