
import session from "lib/session";

export default {
    desc: "Shows current username",
    exec: async (/* term, cmd, opts, args */) => {
        return session.username();
    }
};
