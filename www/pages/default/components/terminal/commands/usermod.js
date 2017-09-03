
import api from "api.io-client";

export default {
    desc: "Modify a user's groups",
    args: [ "username", "groupname" ],
    opts: {
        r: "Remove group"
    },
    exec: async (term, cmd, opts, args) => {
        if (opts.r) {
            await api.auth.disconnect(args.username, args.groupname);
        } else {
            await api.auth.connect(args.username, args.groupname);
        }
    },
    completion: async (term, cmd, name, value) => {
        if (name === "username") {
            const nodes = await api.vfs.list("/users");
            const list = nodes.map((node) => node.name);

            return term.util.bestMatch(value, list);
        } else if (name === "groupname") {
            const nodes = await api.vfs.list("/groups");
            const list = nodes.map((node) => node.name);

            return term.util.bestMatch(value, list);
        }

        return [];
    }
};
