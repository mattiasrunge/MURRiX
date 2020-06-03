"use strict";

const assert = require("assert");
const request = require("request-promise-native");
const config = require("../../../config");
const log = require("../../../lib/log")(module);

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

    return data.results[0].formatted_address;
};
