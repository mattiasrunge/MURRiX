
import api from "api.io-client";

export default {
    desc: "Print node attributes",
    args: [ "?path" ],
    opts: {
        l: "Don't follow links"
    },
    exec: async (term, cmd, opts, args) => {
        const abspath = await term.getAbspath(args.path, true);
        const node = await api.vfs.resolve(abspath, { nofollow: opts.l });

        return JSON.stringify(node.attributes, null, 2);
    },
    completion: async (term, cmd, name, value) => {
        if (name === "path") {
            return await term.completePath(value);
        }

        return [];
    }
};
