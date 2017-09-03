
import api from "api.io-client";
import session from "lib/session";

export default {
    desc: "Change user password",
    args: [ "?username" ],
    exec: async (term, cmd, opts, args) => {
        const username = args.username || session.username();

        const password1 = await term.ask("New password:", true);
        const password2 = await term.ask("Confirm new password:", true);

        if (password1 !== password2) {
            throw new Error("Passwords do not match");
        }

        await api.auth.passwd(username, password1);

        return "Password updated";
    },
    completion: async (term, cmd, name, value) => {
        if (name === "username") {
            const nodes = await api.vfs.list("/users");
            const list = nodes.map((node) => node.name);

            return term.util.bestMatch(value, list);
        }

        return [];
    }
};
