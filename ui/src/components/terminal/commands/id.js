
import { cmd } from "lib/backend";
import session from "lib/session";

export default {
    desc: "Print information about user ids",
    args: [ "?username" ],
    exec: async (term, streams, command, opts, args) => {
        const username = args.username || session.username();
        const info = await cmd.userid(username);
        const groups = info.gids.map((group) => `${group.id}(${group.name})`);

        await streams.stdout.write(`uid=${info.uid.id}(${info.uid.name}) gid=${info.gid.id}(${info.gid.name}) groups=${groups.join(",")}\n`);
    },
    completion: async (term, command, name, value) => {
        if (name === "username") {
            const nodes = await cmd.list("/users");
            const list = nodes.map((node) => node.name);

            return term.util.bestMatch(value, list);
        }

        return [];
    }
};
