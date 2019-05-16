
import { cmd } from "lib/backend";
import session from "lib/session";

export default {
    desc: "Login",
    args: [ "?username" ],
    exec: async (term, streams, command, opts, args) => {
        let username = args.username;

        if (!username) {
            term.setPrompt({ prompt: "Username:" });
            username = await streams.stdin.read();
        }

        term.setPrompt({ prompt: "Password:", obscure: true });
        const password = await streams.stdin.read();

        await cmd.login(username, password);

        await session.waitFor("update", 5000);
    },
    completion: async (term, command, name, value) => {
        if (name === "username") {
            const nodes = await cmd.list("/users");
            const list = nodes.map((node) => node.name);

            return term.util.bestMatch(value, list);
        }

        return [];
    }
};
