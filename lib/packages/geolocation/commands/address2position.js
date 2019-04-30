"use strict";

const assert = require("assert");
const { isGuest } = require("../../../core/auth");
const request = require("request-promise-native");
const config = require("../../../configuration");

module.exports = async (session, address) => {
    assert(!isGuest(session), "Permission denied");

    const options = {
        uri: "https://maps.googleapis.com/maps/api/geocode/json",
        qs: {
            address,
            sensor: false,
            key: config.googleServerKey
        },
        json: true
    };

    const data = await request(options);

    assert(data.status === "OK", data.errorMessage);

    if (data.results.length === 0) {
        return false;
    }

    return {
        longitude: data.results[0].geometry.location.lng,
        latitude: data.results[0].geometry.location.lat
    };
};
