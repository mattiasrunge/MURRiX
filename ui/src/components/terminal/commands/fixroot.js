
import { cmd } from "lib/backend";

export default {
    desc: "Fix root rights",
    exec: async (term, streams /* , command, opts, args */) => {
        try {
            await cmd.fixroot();
        } catch (error) {
            console.log(error);
        }

        await streams.stdout.write("Complete");
    }
};
