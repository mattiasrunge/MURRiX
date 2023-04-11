import Node from "../../../lib/Node.mjs";
import { getAdminClient } from "../../../auth/index.mjs";

export default async (client, username, resetId, password) => {
    const user = await Node.resolve(await getAdminClient(), `/users/${username}`);
    await user.resetPassword(await getAdminClient(), resetId, password);
};
