
import { cmd } from "lib/backend";

export default {
    desc: "Move a node",
    args: [ "srcpath", "dstpath" ],
    exec: async (term, streams, command, opts, args) => {
        const srcpath = await term.getAbspath(args.srcpath, false);
        const dstpath = await term.getAbspath(args.dstpath, false);

        await cmd.move(srcpath, dstpath);
    },
    completion: async (term, command, name, value) => {
        if (name === "srcpath" || name === "dstpath") {
            return await term.completePath(value);
        }

        return [];
    }
};
