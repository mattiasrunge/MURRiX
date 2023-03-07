import assert from "node:assert";
import Node from "../../../lib/Node.mjs";
import { api } from "../../../api/index.mjs";

export default async (client, abspath, residentpath) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "l", "Get only remove residents of locations");

    const residents = await api.list(client, `${abspath}/residents`, { nofollow: true });
    const resident = residents.find((resident) => resident.attributes.path === residentpath);

    assert(resident, "No such resident found");

    await api.unlink(client, resident.path);
};
