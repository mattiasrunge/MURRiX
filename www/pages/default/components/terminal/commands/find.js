
import api from "api.io-client";

export default {
    desc: "Find nodes",
    args: [ "search" ],
    exec: async (term, cmd, opts, args) => {
        const abspath = term.current().path;
        const paths = await api.vfs.find(abspath, args.search);

        return paths.join("\n");
    }
};
