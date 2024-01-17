import { api } from "../../../api/index.mjs";

export default async (client, groupname, username) => {
    const s1 = await api.symlink(client, `/groups/${groupname}`, `/users/${username}/groups/${groupname}`);
    const s2 = await api.symlink(client, `/users/${username}`, `/groups/${groupname}/users/${username}`);

    await api.groupnodes(client, [ s1, s2 ]);
};
