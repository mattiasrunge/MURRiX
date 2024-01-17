import { api } from "../../api/index.mjs";

const setup = async (client) => {
    // Create folder
    await api.ensure(client, "/labels", "d");
    await api.chmod(client, "/labels", 0o775);
};

export default setup;
