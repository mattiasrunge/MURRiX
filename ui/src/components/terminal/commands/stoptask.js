
import { cmd } from "lib/backend";

export default {
    desc: "Stop a task",
    args: [ "task" ],
    exec: async (term, streams, command, opts, args) => {
        await cmd.stoptask(args.task);
    },
    completion: async (term, command, name, value) => {
        if (name === "task") {
            const list = await cmd.listtasks();

            return term.util.bestMatch(value, Object.keys(list));
        }

        return [];
    }
};
