
import api from "api.io-client";
import session from "lib/session";

export default {
    desc: "Give admin access",
    exec: async (term /* , cmd, opts, args */) => {
        const password = await term.ask("Admin password:", true);

        await api.auth.becomeAdmin(password);

        session.adminGranted(!!password);

        return password ? "Admin rights granted" : "Admin rights recinded";
    },
    completion: async (term, cmd, name, value) => {
        if (name === "username") {
            const nodes = await api.vfs.list("/users");
            const list = nodes.map((node) => node.name);

            return term.bestMatch(value, list);
        }

        return [];
    }
};
