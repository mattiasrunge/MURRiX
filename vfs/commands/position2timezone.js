"use strict";

const assert = require("assert");
const { isGuest } = require("../lib/auth");
const request = require("request-promise-native");
const config = require("../../lib/configuration");

module.exports = async (session, longitude, latitude) => {
    assert(!isGuest(session), "Permission denied");

    const options = {
        uri: "https://maps.googleapis.com/maps/api/timezone/json",
        qs: {
            location: `${latitude},${longitude}`,
            timestamp: 0,
            key: config.googleServerKey
        },
        json: true
    };

    const data = await request(options);
    // {
    //     "dstOffset" : 3600,
    //     "rawOffset" : 0,
    //     "status" : "OK",
    //     "timeZoneId" : "America/New_York",
    //     "timeZoneName" : "Eastern Standard Time"
    // }

    if (data.status !== "OK") {
        throw new Error(data.errorMessage);
    }

    return {
        utcOffset: data.rawOffset,
        name: data.timeZoneId
    };
};
