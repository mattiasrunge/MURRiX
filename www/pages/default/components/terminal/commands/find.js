
import api from "api.io-client";

export default {
    desc: "Find nodes",
    args: [ "search" ],
    exec: async (term, streams, cmd, opts, args) => {
        const abspath = term.current().path;
        const paths = await api.vfs.find(abspath, args.search);

        for (const path of paths) {
            await streams.stdout.write(`${path}\n`);
        }
    }
};
