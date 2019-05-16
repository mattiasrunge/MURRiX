
import columnify from "columnify";
import { cmd } from "lib/backend";

export default {
    desc: "List users",
    exec: async (term, streams/* , command, opts, args */) => {
        const users = await cmd.users();

        for (const user of users) {
            user.groups = await cmd.groups(user.name);
        }

        const columns = columnify(users.map((item) => ({
            name: item.attributes.name,
            username: item.name,
            uid: item.attributes.uid,
            active: item.attributes.inactive ? "No" : "Yes",
            lastLogin: item.attributes.loginTime || "Never",
            groups: item.groups.map((g) => g.name).join(", ")
        })), {
            columnSplitter: "  "
        });

        for (const line of columns.split("\n")) {
            await streams.stdout.write(`${line}\n`);
        }
    }
};
