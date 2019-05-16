
import { cmd } from "lib/backend";

export default {
    desc: "Set node ACL",
    args: [ "aclentry", "path" ],
    opts: {
        r: "Recursive setfacl",
        b: "Remove all ACL entries"
    },
    exec: async (term, streams, command, opts, args) => {
        const abspath = await term.getAbspath(args.path, false);

        if (opts.b) {
            await cmd.setfacl(abspath, null, { recursive: opts.r });

            return;
        }

        const ac = {};
        const [ what, name, modestr ] = args.aclentry.split(":");

        if (what === "u") {
            ac.uid = parseInt(name, 10);

            if (isNaN(ac.uid)) {
                ac.uid = await cmd.uid(name);
            }
        } else if (what === "g") {
            ac.gid = parseInt(name, 10);

            if (isNaN(ac.gid)) {
                ac.gid = await cmd.gid(name);
            }
        } else {
            throw new Error("Invalid aclentry, expected it to begin with u or g");
        }

        ac.mode = 0;

        if (modestr) {
            ac.mode |= modestr.includes("r") ? cmd.MASK_ACL_READ : 0;
            ac.mode |= modestr.includes("w") ? cmd.MASK_ACL_WRITE : 0;
            ac.mode |= modestr.includes("x") ? cmd.MASK_ACL_EXEC : 0;
        }

        await cmd.setfacl(abspath, ac, { recursive: opts.r });
    },
    completion: async (term, command, name, value) => {
        if (name === "path") {
            return await term.completePath(value);
        }

        return [];
    }
};
