
import api from "api.io-client";

export default {
    desc: "Move a node",
    args: [ "srcpath", "dstpath" ],
    exec: async (term, cmd, opts, args) => {
        const srcpath = await term.getAbspath(args.srcpath, false);
        const dstpath = await term.getAbspath(args.dstpath, false);

        await api.vfs.move(srcpath, dstpath);
    },
    completion: async (term, cmd, name, value) => {
        if (name === "srcpath" || name === "dstpath") {
            return await term.completePath(value);
        }

        return [];
    }
};
