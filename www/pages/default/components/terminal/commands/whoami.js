
import session from "lib/session";

export default {
    desc: "Shows current username",
    exec: async (term, streams/* , cmd, opts, args */) => {
        await streams.stdout.write(session.username());
    }
};
