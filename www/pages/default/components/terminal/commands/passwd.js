
import api from "api.io-client";
import session from "lib/session";

export default {
    desc: "Change user password",
    args: [ "?username" ],
    exec: async (term, streams, cmd, opts, args) => {
        const username = args.username || session.username();

        term.setPrompt({ prompt: "New password:", obscure: true });
        const password1 = await streams.stdin.read();

        term.setPrompt({ prompt: "Confirm new password:", obscure: true });
        const password2 = await streams.stdin.read();

        if (password1 !== password2) {
            throw new Error("Passwords do not match");
        }

        await api.auth.passwd(username, password1);

        await streams.stdout.write("Password updated");
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
