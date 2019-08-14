
import { cmd } from "lib/backend";

export default {
    desc: "Fix user rights",
    exec: async (term, streams /* , command, opts, args */) => {
        try {
            await cmd.fixusers();
        } catch (e) {
            console.log(e);
        }

        await streams.stdout.write("Complete");
    }
};
