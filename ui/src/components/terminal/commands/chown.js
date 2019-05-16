
import { cmd } from "lib/backend";

export default {
    desc: "Change owner and group for node",
    args: [ "userstring", "path" ],
    opts: {
        r: "Recursive chown"
    },
    exec: async (term, streams, command, opts, args) => {
        const abspath = await term.getAbspath(args.path, false);
        const options = { recursive: opts.r };

        let group = false;
        let user = args.userstring;

        if (args.userstring.includes(":")) {
            const parts = args.userstring.split(":");

            user = parts[0];
            group = parts[1];
        }

        let uid = parseInt(user, 10);
        let gid = group ? parseInt(group, 10) : 0;

        uid = isNaN(uid) ? (await cmd.uid(user)) : uid;
        gid = isNaN(gid) ? (await cmd.gid(group)) : gid;

        await cmd.chown(abspath, uid, gid, options);
    },
    completion: async (term, command, name, value) => {
        if (name === "path") {
            return await term.completePath(value);
        }

        return [];
    }
};
