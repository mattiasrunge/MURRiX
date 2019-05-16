
import { cmd } from "lib/backend";

export default {
    desc: "Modify a user's activation status",
    args: [ "username" ],
    opts: {
        i: "Set user inactive, if not given set user active"
    },
    exec: async (term, streams, command, opts, args) => {
        if (opts.i) {
            await cmd.useractivation(args.username, false);
            await streams.stdout.write("User deactivated\n");

            return;
        }

        await cmd.useractivation(args.username, true);
        await streams.stdout.write("User activated\n");
    },
    completion: async (term, command, name, value) => {
        if (name === "username") {
            const nodes = await cmd.users();
            const list = nodes.map((node) => node.name);

            return term.util.bestMatch(value, list);
        }

        return [];
    }
};
