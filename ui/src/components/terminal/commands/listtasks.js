
import columnify from "columnify";
import { cmd } from "lib/backend";

export default {
    desc: "List system tasks",
    exec: async (term, streams /* , command, opts, args */) => {
        const tasks = await cmd.listtasks();

        const columns = columnify(Object.entries(tasks).map(([ name, status ]) => {
            return {
                name,
                ...status
            };
        }), {
            showHeaders: true
        });

        for (const line of columns.split("\n")) {
            await streams.stdout.write(`${line}\n`);
        }
    }
};
