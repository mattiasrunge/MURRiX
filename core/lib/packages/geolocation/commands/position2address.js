"use strict";

const assert = require("assert");
const request = require("request-promise-native");
const config = require("../../../configuration");

module.exports = async (client, longitude, latitude) => {
    assert(!client.isGuest(), "Permission denied");

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

    try {
        assert(data.status === "OK", data.errorMessage);
    } catch (error) {
        console.error(JSON.stringify(options, null, 2), error);
        throw error;
    }

    if (data.results.length === 0) {
        return false;
    }

    return data.results[0].formatted_address;
};
