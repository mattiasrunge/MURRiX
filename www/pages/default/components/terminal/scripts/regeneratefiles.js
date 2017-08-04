
import api from "api.io-client";

export default {
    desc: "Find and regenerate images in album",
    args: [ "?path" ],
    exec: async (term, cmd, opts, args) => {
        const abspath = await term.getAbspath(args.path, true);
        const node = await api.vfs.resolve(abspath);

        if (node.properties.type !== "a") {
            throw new Error("Must be run on an album");
        }

        const filespath = `${abspath}/files`;
        const nodes = await api.vfs.list(filespath, { nofollow: true });

        term.log(`Found ${nodes.length} nodes`);

        for (const nodepath of nodes) {
            term.log(`Regenerating ${nodepath.node.attributes.name}`);
            await api.file.regenerate(nodepath.path);
        }
    },
    completion: async (term, cmd, name, value) => {
        if (name === "path") {
            return await term.completePath(value);
        }

        return [];
    }
};
