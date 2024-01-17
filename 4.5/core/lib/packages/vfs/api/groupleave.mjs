import { api } from "../../../api/index.mjs";

export default async (client, groupname, username) => {
    // TODO: Disallow removing admin from the admin group
    // TODO: Disallow removing guest from the guest group

    await api.unlink(client, `/users/${username}/groups/${groupname}`);
    await api.unlink(client, `/groups/${groupname}/users/${username}`);
};
