
import { cmd } from "lib/backend";

export default {
    desc: "Find nodes",
    args: [ "search" ],
    exec: async (term, streams, command, opts, args) => {
        const abspath = term.current().path;
        const paths = await cmd.find(abspath, args.search);

        for (const path of paths) {
            await streams.stdout.write(`${path}\n`);
        }
    }
};
