import path from "node:path";
import assert from "node:assert";
import moment from "moment";
import { getAdminClient } from "../../../auth/index.mjs";
import { api } from "../../../api/index.mjs";

export default async (client, abspath, text) => {
    assert(await api.access(client, abspath, "r"), "Permission denied");

    const commentsPath = path.join(abspath, "comments");

    await api.ensure(await getAdminClient(), commentsPath, "d");

    const newClient = await client.clone({ almighty: true });

    try {
        return api.create(newClient, commentsPath, "k", moment().format(), { text });
    } finally {
        await newClient.destroy();
    }
};
