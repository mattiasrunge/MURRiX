
import api from "api.io-client";

export default {
    desc: "Print node parent paths",
    args: [ "?path" ],
    opts: {
        l: "Don't follow links",
        i: "Path is an id"
    },
    exec: async (term, cmd, opts, args) => {
        let id;

        if (!opts.i) {
            const abspath = await term.getAbspath(args.abspath, true);
            const node = await api.vfs.resolve(abspath, { nofollow: opts.l });

            id = node._id;
        } else {
            id = args.path;
        }

        const paths = await api.vfs.lookup(id);

        return paths.join("\n");
    },
    completion: async (term, cmd, name, value) => {
        if (name === "path") {
            return await term.completePath(value);
        }

        return [];
    }
};
