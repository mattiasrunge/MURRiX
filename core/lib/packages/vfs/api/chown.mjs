import Node from "../../../lib/Node.mjs";

export default async (client, abspath, uid, gid, options = {}) => {
    const nodepath = await Node.resolve(client, abspath, { readlink: true });

    await nodepath.chown(client, uid, gid, options);
};
