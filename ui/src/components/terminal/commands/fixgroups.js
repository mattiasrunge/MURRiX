
import { cmd } from "lib/backend";

export default {
    desc: "Fix group rights and integrity",
    exec: async (term, streams /* , command, opts, args */) => {
        try {
            await cmd.fixgroups();
        } catch (error) {
            console.log(error);
        }

        await streams.stdout.write("Complete");
    }
};
