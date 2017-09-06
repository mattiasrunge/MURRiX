
import api from "api.io-client";

export default {
    desc: "Modify a user's activation status",
    args: [ "username" ],
    opts: {
        i: "Set user inactive, if not given set user active"
    },
    exec: async (term, streams, cmd, opts, args) => {
        if (opts.i) {
            await api.auth.inactive(args.username, true);
            await streams.stdout.write("User deactivated\n");

            return;
        }

        await api.auth.inactive(args.username, false);
        await streams.stdout.write("User activated\n");
    },
    completion: async (term, cmd, name, value) => {
        if (name === "username") {
            const nodes = await api.vfs.list("/users");
            const list = nodes.map((node) => node.name);

            return term.util.bestMatch(value, list);
        }

        return [];
    }
};
