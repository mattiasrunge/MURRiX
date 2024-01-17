import { GID_USERS } from "../../auth/index.mjs";
import { api } from "../../api/index.mjs";

const setup = async (client) => {
    // Create folders
    await api.ensure(client, "/locations", "d", { gid: GID_USERS });
};

export default setup;
