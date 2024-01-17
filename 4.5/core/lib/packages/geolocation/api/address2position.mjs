import assert from "node:assert";
import request from "request-promise-native";
import config from "../../../config/index.mjs";
import { createLog } from "../../../lib/log.mjs";

const log = createLog(import.meta.url);

export default async (client, address) => {
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
