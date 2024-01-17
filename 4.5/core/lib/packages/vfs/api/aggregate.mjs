import assert from "node:assert";
import db from "../../../db/index.mjs";

export default async (client, pipeline) => {
    assert(client.isAdmin(), "Permission denied");

    const cursor = await db.aggregate("nodes", pipeline);

    return cursor.toArray();
};
