import assert from "node:assert";
import { api } from "../../../api/index.mjs";

export default async (client, value) => {
    assert(!client.isGuest(), "Permission denied");

    const grps = await api.groups(client);
    const id = Number.parseInt(value, 10);

    if (Number.isNaN(id)) {
        const group = grps.find((group) => group.name === value);

        assert(group, `No group matching ${value} found`);

        return group.attributes.gid;
    }

    const group = grps.find((group) => group.attributes.gid === id);

    assert(group, `No group matching ${value} found`);

    return group.name;
};
