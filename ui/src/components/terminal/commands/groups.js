
import columnify from "columnify";
import { cmd } from "lib/backend";

export default {
    desc: "List groups",
    exec: async (term, streams/* , command, opts, args */) => {
        const groups = await cmd.groups();

        for (const group of groups) {
            group.users = await cmd.users(group.name);
        }

        const columns = columnify(groups.map((item) => ({
            name: item.name,
            gid: item.attributes.gid,
            description: item.attributes.description,
            users: item.users.map((u) => u.name).join(", ")
        })), {
            columnSplitter: "  "
        });

        for (const line of columns.split("\n")) {
            await streams.stdout.write(`${line}\n`);
        }
    }
};
