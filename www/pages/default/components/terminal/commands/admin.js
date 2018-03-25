
import api from "api.io-client";
import session from "lib/session";

export default {
    desc: "Give admin access",
    exec: async (term, streams /* , cmd, opts, args */) => {
        term.setPrompt({ prompt: "Admin password:", obscure: true });
        const password = await streams.stdin.read();

        await api.vfs.admin(password);

        await session.waitFor("update", 5000);

        await streams.stdout.write(password ? "Admin rights granted" : "Admin rights recinded");
    }
};
