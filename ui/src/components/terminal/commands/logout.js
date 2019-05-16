
import { cmd } from "lib/backend";
import session from "lib/session";

export default {
    desc: "Logout",
    exec: async (/* term, streams, command, opts, args */) => {
        await cmd.logout();

        await session.waitFor("update", 5000);
    }
};
