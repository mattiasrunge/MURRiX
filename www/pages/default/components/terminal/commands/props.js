
import api from "api.io-client";

export default {
    desc: "Print node properties",
    args: [ "?path" ],
    opts: {
        l: "Don't follow links"
    },
    exec: async (terminal, cmd, opts, args) => {
        const cwd = terminal.pathhandler.current.path;
        const abspath = args.path ? await api.vfs.normalize(cwd, args.path) : cwd;
        const node = await api.vfs.resolve(abspath, { nofollow: opts.l });

        return JSON.stringify(node.properties, null, 2);
    }
};
