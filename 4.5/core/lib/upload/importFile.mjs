import { api } from "../api/index.mjs";
import { createLog } from "../lib/log.mjs";

const log = createLog(import.meta.url);

const importFile = async (client, niceName, filename, abspath) => {
    log.info(`Upload of file ${filename} completed successfully!`);

    const name = await api.uniquename(client, abspath, niceName);

    const node = await api.create(client, abspath, "f", name, {
        name: niceName,
        _source: {
            filename
        }
    });

    log.info(`Import of file ${filename} completed successfully at ${node.path} with id ${node._id}!`);
};

export default importFile;
