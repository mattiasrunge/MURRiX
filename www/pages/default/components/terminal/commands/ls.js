
import api from "api.io-client";
import columnify from "columnify";
import moment from "moment";
import utils from "lib/utils";

export default {
    desc: "List nodes",
    args: [ "?path" ],
    opts: {
        l: "List with details",
        1: "Show as list"
    },
    exec: async (term, streams, cmd, opts, args) => {
        const separator = !streams.stdout.isPipe() && !opts[1] ? " " : "\n";
        const abspath = await term.getAbspath(args.path, true);
        const list = await api.vfs.list(abspath, { noerror: true, nofollow: true });

        if (!opts.l) {
            for (const item of list) {
                await streams.stdout.write(`${item.name}${separator}`);
            }

            return;
        }

        const node = await api.vfs.resolve(abspath);
        const parent = await api.vfs.resolve(await api.vfs.dirname(abspath));

        list.unshift({
            ...node,
            name: "."
        }, {
            ...parent,
            name: ".."
        });

        const ucache = {};
        const gcache = {};

        for (const item of list) {
            const uid = item.properties.uid;
            const gid = item.properties.gid;

            item.uid = ucache[uid] = ucache[uid] || await api.vfs.uid(uid);
            item.gid = gcache[gid] = gcache[gid] || await api.vfs.gid(gid);
        }

        const columns = columnify(list.map((item) => {
            let name = item.name;

            if (item.properties.type === "s") {
                name += ` -> ${item.attributes.path}`;
            }

            const acl = item.properties.acl && item.properties.acl.length > 0 ? "+" : "";
            const mode = utils.modeString(item.properties.mode);

            return {
                mode: item.properties.type + mode + acl,
                count: item.properties.count,
                uid: item.uid,
                gid: item.gid,
                children: Object.keys(item.properties.children).length,
                mtime: moment(item.properties.mtime).format(),
                name: name
            };
        }), {
            showHeaders: false
        });

        for (const line of columns.split("\n")) {
            await streams.stdout.write(`${line}\n`);
        }
    },
    completion: async (term, cmd, name, value) => {
        if (name === "path") {
            return await term.completePath(value);
        }

        return [];
    }
};
