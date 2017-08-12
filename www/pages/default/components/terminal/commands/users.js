
import api from "api.io-client";
import columnify from "columnify";

export default {
    desc: "List users",
    exec: async (/* term, cmd, opts, args */) => {
        const users = await api.vfs.list("/users");

        for (const user of users) {
            user.groups = await api.vfs.list(`${user.path}/groups`);
        }

        const columns = columnify(users.map((item) => {
            return {
                name: item.node.attributes.name,
                username: item.name,
                uid: item.node.attributes.uid,
                inactive: item.node.attributes.inactive ? "Yes" : "No",
                lastLogin: item.node.attributes.loginTime || "Never",
                groups: item.groups.map((g) => g.name).join(", ")
            };
        }), {
            columnSplitter: "  "
        });

        return columns;
    }
};
