
import session from "lib/session";

export default {
    desc: "Shows current username",
    exec: async (term, streams/* , command, opts, args */) => {
        await streams.stdout.write(session.username());
    }
};
