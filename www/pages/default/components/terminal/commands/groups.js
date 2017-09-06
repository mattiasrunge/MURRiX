
import api from "api.io-client";
import columnify from "columnify";

export default {
    desc: "List groups",
    exec: async (term, streams/* , cmd, opts, args */) => {
        const groups = await api.vfs.list("/groups");

        for (const group of groups) {
            group.users = await api.vfs.list(`${group.path}/users`);
        }

        const columns = columnify(groups.map((item) => {
            return {
                name: item.name,
                gid: item.node.attributes.gid,
                description: item.node.attributes.description,
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
