
import api from "api.io-client";

export default {
    desc: "Link a node",
    args: [ "srcpath", "dstpath" ],
    opts: {
        s: "Create a symlink"
    },
    exec: async (term, cmd, opts, args) => {
        const srcpath = await term.getAbspath(args.srcpath, false);
        const dstpath = await term.getAbspath(args.dstpath, false);

        if (opts.s) {
            await api.vfs.symlink(srcpath, dstpath);
        } else {
            await api.vfs.link(srcpath, dstpath);
        }
    },
    completion: async (term, cmd, name, value) => {
        if (name === "srcpath" || name === "dstpath") {
            return await term.completePath(value);
        }

        return [];
    }
};
