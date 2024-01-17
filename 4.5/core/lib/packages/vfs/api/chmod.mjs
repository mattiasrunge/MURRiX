import Node from "../../../lib/Node.mjs";

export default async (client, abspath, mode, options = {}) => {
    const nodepath = await Node.resolve(client, abspath, { readlink: true });

    await nodepath.chmod(client, mode, options);
};
