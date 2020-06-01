"use strict";

const assert = require("assert");
const request = require("request-promise-native");
const config = require("../../../lib/configuration");
const log = require("../../../lib/log")(module);

module.exports = async (client, address) => {
    assert(!client.isGuest(), "Permission denied");

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

    try {
        assert(data.status === "OK", data.error_message);
    } catch (error) {
        if (data.status === "REQUEST_DENIED") {
            log.error("Request denied", data.error_message);

            return false;
        }

        throw error;
    }

    if (data.results.length === 0) {
        return false;
    }

    return {
        longitude: data.results[0].geometry.location.lng,
        latitude: data.results[0].geometry.location.lat
    };
};
