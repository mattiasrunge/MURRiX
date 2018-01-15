
import api from "api.io-client";

export default {
    desc: "Modify a user's activation status",
    args: [ "username" ],
    opts: {
        i: "Set user inactive, if not given set user active"
    },
    exec: async (term, streams, cmd, opts, args) => {
        if (opts.i) {
            await api.vfs.useractivation(args.username, false);
            await streams.stdout.write("User deactivated\n");

            return;
        }

        await api.vfs.useractivation(args.username, true);
        await streams.stdout.write("User activated\n");
    },
    completion: async (term, cmd, name, value) => {
        if (name === "username") {
            const nodes = await api.vfs.users();
            const list = nodes.map((node) => node.name);

            return term.util.bestMatch(value, list);
        }

        return [];
    }
};
