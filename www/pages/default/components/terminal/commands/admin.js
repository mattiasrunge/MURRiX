
import api from "api.io-client";
import session from "lib/session";

export default {
    desc: "Give admin access",
    exec: async (term, streams /* , cmd, opts, args */) => {
        term.setPrompt({ prompt: "Admin password:", obscure: true });
        const password = await streams.stdin.read();

        await api.auth.becomeAdmin(password);

        session.adminGranted(!!password);

        await streams.stdout.write(password ? "Admin rights granted" : "Admin rights recinded");
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
