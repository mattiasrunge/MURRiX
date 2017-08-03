
import api from "api.io-client";
import session from "lib/session";

export default {
    desc: "Print information about user ids",
    args: [ "?username" ],
    exec: async (term, cmd, opts, args) => {
        const username = args.username || session.username();
        const info = await api.auth.id(username);
        const groups = info.gids.map((group) => `${group.id}(${group.name})`);

        return `uid=${info.uid.id}(${info.uid.name}) gid=${info.gid.id}(${info.gid.name}) groups=${groups.join(",")}`;
    }
};
