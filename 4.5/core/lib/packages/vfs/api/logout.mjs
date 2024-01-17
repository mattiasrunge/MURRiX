import Node from "../../../lib/Node.mjs";
import { getAdminClient, USERNAME_GUEST } from "../../../auth/index.mjs";
import { api } from "../../../api/index.mjs";

export default async (client) => {
    const user = await Node.resolve(await getAdminClient(), `/users/${USERNAME_GUEST}`);
    const grps = await api.groups(await getAdminClient(), USERNAME_GUEST);

    client.setUser({
        username: USERNAME_GUEST,
        uid: user.attributes.uid,
        gid: user.attributes.gid,
        gids: grps.map((group) => group.attributes.gid)
    });

    console.log("client-logout", client.session.user);

    return user.serialize(client);
};
