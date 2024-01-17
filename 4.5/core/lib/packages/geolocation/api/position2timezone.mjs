import assert from "node:assert";
import request from "request-promise-native";
import config from "../../../config/index.mjs";
import { createLog } from "../../../lib/log.mjs";

const log = createLog(import.meta.url);

export default async (client, longitude, latitude) => {
    assert(!client.isGuest(), "Permission denied");

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

    try {
        assert(data.status === "OK", data.error_message);
    } catch (error) {
        if (data.status === "REQUEST_DENIED") {
            log.error("Request denied", data.error_message);

            return false;
        }

        throw error;
    }

    return {
        utcOffset: data.rawOffset,
        name: data.timeZoneId
    };
};
