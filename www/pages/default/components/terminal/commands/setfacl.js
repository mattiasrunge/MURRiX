
import api from "api.io-client";

export default {
    desc: "Set node ACL",
    args: [ "aclentry", "path" ],
    opts: {
        r: "Recursive setfacl",
        b: "Remove all ACL entries"
    },
    exec: async (term, cmd, opts, args) => {
        const abspath = await term.getAbspath(args.path, false);

        if (opts.b) {
            await api.vfs.setfacl(abspath, null, { recursive: opts.r });

            return;
        }

        const ac = {};
        const [ what, name, modestr ] = args.aclentry.split(":");

        if (what === "u") {
            ac.uid = parseInt(name, 10);

            if (isNaN(ac.uid)) {
                ac.uid = await api.auth.uid(name);
            }
        } else if (what === "g") {
            ac.gid = parseInt(name, 10);

            if (isNaN(ac.gid)) {
                ac.gid = await api.auth.gid(name);
            }
        } else {
            throw new Error("Invalid aclentry, expected it to begin with u or g");
        }

        ac.mode = 0;

        if (modestr) {
            ac.mode |= modestr.includes("r") ? api.vfs.MASK_ACL_READ : 0;
            ac.mode |= modestr.includes("w") ? api.vfs.MASK_ACL_WRITE : 0;
            ac.mode |= modestr.includes("x") ? api.vfs.MASK_ACL_EXEC : 0;
        }

        await api.vfs.setfacl(abspath, ac, { recursive: opts.r });
    },
    completion: async (term, cmd, name, value) => {
        if (name === "path") {
            return await term.completePath(value);
        }

        return [];
    }
};
