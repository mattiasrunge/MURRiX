import assert from "node:assert";
import moment from "moment";
import { getAdminClient } from "../../../auth/index.mjs";
import { api } from "../../../api/index.mjs";

export default async (client) => {
    assert(!client.isGuest(), "Permission denied");

    const nodes = await api.query(await getAdminClient(), {
        "properties.type": "t",
        "attributes.type": { $in: [ "birth", "death", "engagement", "marriage" ] }
    }, {
        projection: {
            "attributes.time": 1,
            "attributes.type": 1
        }
    });

    const data = {
        birth: Array.from({ length: 12 }).fill(0),
        engagement: Array.from({ length: 12 }).fill(0),
        marriage: Array.from({ length: 12 }).fill(0),
        death: Array.from({ length: 12 }).fill(0)
    };

    for (const node of nodes) {
        if (!node.attributes.time) {
            continue;
        }

        if (node.attributes.time.quality === "utc" ||
            node.attributes.time.accuracy === "second" ||
            node.attributes.time.accuracy === "minute" ||
            node.attributes.time.accuracy === "hour" ||
            node.attributes.time.accuracy === "day" ||
            node.attributes.time.accuracy === "month") {
            const time = moment(node.attributes.time.timestamp * 1000);
            const month = Number.parseInt(time.format("M"), 10) - 1;

            data[node.attributes.type][month]++;
        }
    }

    return data;
};
