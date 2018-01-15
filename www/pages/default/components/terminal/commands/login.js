
import api from "api.io-client";
import session from "lib/session";

export default {
    desc: "Login",
    args: [ "?username" ],
    exec: async (term, streams, cmd, opts, args) => {
        let username = args.username;

        if (!username) {
            term.setPrompt({ prompt: "Username:" });
            username = await streams.stdin.read();
        }

        term.setPrompt({ prompt: "Password:", obscure: true });
        const password = await streams.stdin.read();

        await api.vfs.login(username, password);

        await session.loadUser();
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
