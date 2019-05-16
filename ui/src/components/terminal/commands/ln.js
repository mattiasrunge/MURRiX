
import { cmd } from "lib/backend";

export default {
    desc: "Link a node",
    args: [ "target", "name" ],
    opts: {
        s: "Create a symlink"
    },
    exec: async (term, streams, command, opts, args) => {
        const srcpath = await term.getAbspath(args.target, false);
        const dstpath = await term.getAbspath(args.name, false);

        if (opts.s) {
            await cmd.symlink(srcpath, dstpath);
        } else {
            await cmd.link(srcpath, dstpath);
        }
    },
    completion: async (term, command, name, value) => {
        if (name === "target" || name === "name") {
            return await term.completePath(value);
        }

        return [];
    }
};
