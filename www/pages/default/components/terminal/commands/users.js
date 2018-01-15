
import api from "api.io-client";
import columnify from "columnify";

export default {
    desc: "List users",
    exec: async (term, streams/* , cmd, opts, args */) => {
        const users = await api.vfs.users();

        for (const user of users) {
            user.groups = await api.vfs.groups(user.name);
        }

        const columns = columnify(users.map((item) => {
            return {
                name: item.attributes.name,
                username: item.name,
                uid: item.attributes.uid,
                active: item.attributes.inactive ? "No" : "Yes",
                lastLogin: item.attributes.loginTime || "Never",
                groups: item.groups.map((g) => g.name).join(", ")
            };
        }), {
            columnSplitter: "  "
        });

        for (const line of columns.split("\n")) {
            await streams.stdout.write(`${line}\n`);
        }
    }
};
