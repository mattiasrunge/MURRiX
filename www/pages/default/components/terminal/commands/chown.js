
import api from "api.io-client";

export default {
    desc: "Change owner and group for node",
    args: [ "userstring", "path" ],
    opts: {
        r: "Recursive chown"
    },
    exec: async (term, streams, cmd, opts, args) => {
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

        uid = isNaN(uid) ? (await api.vfs.uid(user)) : uid;
        gid = isNaN(gid) ? (await api.vfs.gid(group)) : gid;

        await api.vfs.chown(abspath, uid, gid, options);
    },
    completion: async (term, cmd, name, value) => {
        if (name === "path") {
            return await term.completePath(value);
        }

        return [];
    }
};
