
import api from "api.io-client";
import session from "lib/session";

export default {
    desc: "Logout",
    exec: async (/* term, streams, cmd, opts, args */) => {
        await api.vfs.logout();

        await session.waitFor("update", 5000);
    }
};
