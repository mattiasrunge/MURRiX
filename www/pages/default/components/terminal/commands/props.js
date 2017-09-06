
import api from "api.io-client";

export default {
    desc: "Print node properties",
    args: [ "?path" ],
    opts: {
        l: "Don't follow links"
    },
    exec: async (term, streams, cmd, opts, args) => {
        const abspath = await term.getAbspath(args.path, true);
        const node = await api.vfs.resolve(abspath, { nofollow: opts.l });

        await streams.stdout.write(JSON.stringify(node.properties, null, 2));
    },
    completion: async (term, cmd, name, value) => {
        if (name === "path") {
            return await term.completePath(value);
        }

        return [];
    }
};
