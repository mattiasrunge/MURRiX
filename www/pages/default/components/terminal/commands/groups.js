
import api from "api.io-client";
import columnify from "columnify";

export default {
    desc: "List groups",
    exec: async (term, streams/* , cmd, opts, args */) => {
        const groups = await api.vfs.groups();

        for (const group of groups) {
            group.users = await api.vfs.users(group.name);
        }

        const columns = columnify(groups.map((item) => {
            return {
                name: item.name,
                gid: item.attributes.gid,
                description: item.attributes.description,
                users: item.users.map((u) => u.name).join(", ")
            };
        }), {
            columnSplitter: "  "
        });

        for (const line of columns.split("\n")) {
            await streams.stdout.write(`${line}\n`);
        }
    }
};
