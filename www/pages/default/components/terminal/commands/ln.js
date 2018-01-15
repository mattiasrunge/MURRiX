
import api from "api.io-client";

export default {
    desc: "Link a node",
    args: [ "target", "name" ],
    opts: {
        s: "Create a symlink"
    },
    exec: async (term, streams, cmd, opts, args) => {
        const srcpath = await term.getAbspath(args.target, false);
        const dstpath = await term.getAbspath(args.name, false);

        if (opts.s) {
            await api.vfs.symlink(srcpath, dstpath);
        } else {
            await api.vfs.link(srcpath, dstpath);
        }
    },
    completion: async (term, cmd, name, value) => {
        if (name === "target" || name === "name") {
            return await term.completePath(value);
        }

        return [];
    }
};
