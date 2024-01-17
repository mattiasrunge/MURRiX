import { GID_ADMIN } from "../../auth/index.mjs";
import { api } from "../../api/index.mjs";

const setup = async (client) => {
    // Create folders
    await api.ensure(client, "/system", "d", { gid: GID_ADMIN });
    await api.ensure(client, "/system/tasks", "d", { gid: GID_ADMIN });
};

export default setup;
