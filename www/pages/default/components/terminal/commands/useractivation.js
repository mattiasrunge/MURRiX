
import api from "api.io-client";

export default {
    desc: "Modify a user's activation status",
    args: [ "username" ],
    opts: {
        i: "Set user inactive, if not given set user active"
    },
    exec: async (term, cmd, opts, args) => {
        if (opts.i) {
            await api.auth.inactive(args.username, true);

            return "User deactivated";
        }

        await api.auth.inactive(args.username, false);

        return "User activated";
    },
    completion: async (term, cmd, name, value) => {
        if (name === "username") {
            const nodes = await api.vfs.list("/users");
            const list = nodes.map((node) => node.name);

            return term.bestMatch(value, list);
        }

        return [];
    }
};
