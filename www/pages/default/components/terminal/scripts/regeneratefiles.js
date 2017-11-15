
import api from "api.io-client";

export default {
    desc: "Find and regenerate images in album",
    args: [ "?path" ],
    opts: {
        o: "Overwrite existing values"
    },
    exec: async (term, streams, cmd, opts, args) => {
        const abspath = await term.getAbspath(args.path, true);
        const node = await api.vfs.resolve(abspath);
        const options = {};

        if (opts.o) {
            options.overwrite = true;
        }

        if (node.properties.type !== "a") {
            throw new Error("Must be run on an album");
        }

        const filespath = `${abspath}/files`;
        const nodes = await api.vfs.list(filespath, { nofollow: true });

        await streams.stdout.write(`Found ${nodes.length} nodes\n`);

        for (const nodepath of nodes) {
            await streams.stdout.write(`Regenerating ${nodepath.node.attributes.name}\n`);
            await api.file.regenerate(nodepath.path, options);
        }
    },
    completion: async (term, cmd, name, value) => {
        if (name === "path") {
            return await term.completePath(value);
        }

        return [];
    }
};
