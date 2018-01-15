
import api from "api.io-client";

export default {
    desc: "Modify a user's groups",
    args: [ "username", "groupname" ],
    opts: {
        r: "Remove group"
    },
    exec: async (term, streams, cmd, opts, args) => {
        await api.vfs.usermod(args.username, args.groupname, opts.r);
    },
    completion: async (term, cmd, name, value) => {
        if (name === "username") {
            const nodes = await api.vfs.users();
            const list = nodes.map((node) => node.name);

            return term.util.bestMatch(value, list);
        } else if (name === "groupname") {
            const nodes = await api.vfs.groups();
            const list = nodes.map((node) => node.name);

            return term.util.bestMatch(value, list);
        }

        return [];
    }
};
