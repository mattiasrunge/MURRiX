
import { cmd } from "lib/backend";
import session from "lib/session";

export default {
    desc: "Change user password",
    args: [ "?username" ],
    exec: async (term, streams, command, opts, args) => {
        const username = args.username || session.username();

        term.setPrompt({ prompt: "New password:", obscure: true });
        const password1 = await streams.stdin.read();

        term.setPrompt({ prompt: "Confirm new password:", obscure: true });
        const password2 = await streams.stdin.read();

        if (password1 !== password2) {
            throw new Error("Passwords do not match");
        }

        await cmd.passwd(username, password1);

        await streams.stdout.write("Password updated");
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
