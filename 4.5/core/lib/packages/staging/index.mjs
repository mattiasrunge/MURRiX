import { api } from "../../api/index.mjs";
import config from "../../config/index.mjs";

const setup = async (client) => {
    // Ensure tasks
    if (config.stagingDirectory) {
        await api.ensure(client, "/system/tasks/stagefiles", "j", {
            ownerPackage: "staging",
            command: "task_stagefiles"
        });
    } else {
        await api.unlink(client, "/system/tasks/stagefiles");
    }
};

export default setup;
