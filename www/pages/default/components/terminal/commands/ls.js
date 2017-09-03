
import api from "api.io-client";
import columnify from "columnify";
import moment from "moment";
import utils from "lib/utils";

export default {
    desc: "List nodes",
    args: [ "?path" ],
    opts: {
        l: "List with details"
    },
    exec: async (term, cmd, opts, args) => {
        const abspath = await term.getAbspath(args.path, true);
        const list = await api.vfs.list(abspath, { noerror: true, nofollow: true, all: opts.l });

        if (!opts.l) {
            return term.templates.ls({ nodes: list });
        }

        const ucache = {};
        const gcache = {};

        for (const item of list) {
            const uid = item.node.properties.uid;
            const gid = item.node.properties.gid;

            item.uid = ucache[uid] = ucache[uid] || await api.auth.uname(uid);
            item.gid = gcache[gid] = gcache[gid] || await api.auth.gname(gid);
        }

        const columns = columnify(list.map((item) => {
            let name = item.name;

            if (item.node.properties.type === "s") {
                name += ` -> ${item.node.attributes.path}`;
            }

            const acl = item.node.properties.acl && item.node.properties.acl.length > 0 ? "+" : "";
            const mode = utils.modeString(item.node.properties.mode);

            return {
                mode: item.node.properties.type + mode + acl,
                count: item.node.properties.count,
                uid: item.uid,
                gid: item.gid,
                children: Object.keys(item.node.properties.children).length,
                mtime: moment(item.node.properties.mtime).format(),
                name: name
            };
        }), {
            showHeaders: false
        });

        return columns;
    },
    completion: async (term, cmd, name, value) => {
        if (name === "path") {
            return await term.completePath(value);
        }

        return [];
    }
};
