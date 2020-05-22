
import { cmd } from "lib/backend";

export default {
    desc: "Modify a user's groups",
    args: [ "username", "groupname" ],
    opts: {
        r: "Remove from group"
    },
    exec: async (term, streams, command, opts, args) => {
        await cmd.usermod(args.username, args.groupname, opts.r);
    },
    completion: async (term, command, name, value) => {
        if (name === "username") {
            const nodes = await cmd.users();
            const list = nodes.map((node) => node.name);

            return term.util.bestMatch(value, list);
        } else if (name === "groupname") {
            const nodes = await cmd.groups();
            const list = nodes.map((node) => node.name);

            return term.util.bestMatch(value, list);
        }

        return [];
    }
};
