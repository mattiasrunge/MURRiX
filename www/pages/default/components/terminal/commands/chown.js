
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
        let username = args.userstring;

        if (args.userstring.includes(":")) {
            const parts = args.userstring.split(":");

            username = parts[0];
            group = parts[1];
        }

        await api.vfs.chown(abspath, username, group, options);
    },
    completion: async (term, cmd, name, value) => {
        if (name === "path") {
            return await term.completePath(value);
        }

        return [];
    }
};
