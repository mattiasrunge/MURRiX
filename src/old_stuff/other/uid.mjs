import assert from "node:assert";
import { api } from "../../../api/index.mjs";

export default async (client, value) => {
    assert(!client.isGuest(), "Permission denied");

    const usrs = await api.users(client);
    const id = Number.parseInt(value, 10);

    if (Number.isNaN(id)) {
        const user = usrs.find((user) => user.name === value);

        assert(user, `No user matching ${value} found`);

        return user.attributes.uid;
    }

    const user = usrs.find((user) => user.attributes.uid === id);

    assert(user, `No user matching ${value} found`);

    return user.name;
};
