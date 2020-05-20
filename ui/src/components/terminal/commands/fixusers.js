
import { cmd } from "lib/backend";

export default {
    desc: "Fix user rights and integrity",
    exec: async (term, streams /* , command, opts, args */) => {
        try {
            await cmd.fixusers();
        } catch (error) {
            console.log(error);
        }

        await streams.stdout.write("Complete");
    }
};
