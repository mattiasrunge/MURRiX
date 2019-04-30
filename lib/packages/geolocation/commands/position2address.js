"use strict";

const assert = require("assert");
const request = require("request-promise-native");
const { isGuest } = require("../../../core/auth");
const config = require("../../../configuration");

module.exports = async (session, longitude, latitude) => {
    assert(!isGuest(session), "Permission denied");

    const options = {
        uri: "https://maps.googleapis.com/maps/api/geocode/json",
        qs: {
            latlng: `${latitude},${longitude}`,
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

    return data.results[0].formatted_address;
};
