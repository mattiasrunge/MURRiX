
import api from "api.io-client";
import utils from "lib/utils";

export default {
    desc: "Print node ACL",
    args: [ "path" ],
    exec: async (term, streams, cmd, opts, args) => {
        const abspath = await term.getAbspath(args.path, false);
        const node = await api.vfs.resolve(abspath, { nofollow: true });
        const uname = await api.auth.uname(node.properties.uid);
        const gname = await api.auth.gname(node.properties.gid);
        const umode = utils.modeString(node.properties.mode, { owner: true });
        const gmode = utils.modeString(node.properties.mode, { group: true });
        const omode = utils.modeString(node.properties.mode, { other: true });
        const aclUsers = [];
        const aclGroups = [];

        if (node.properties.acl && node.properties.acl.length > 0) {
            for (const ac of node.properties.acl) {
                if (ac.uid) {
                    aclUsers.push(`user:${await api.auth.uname(ac.uid)}:${utils.modeString(ac.mode, { acl: true })}`);
                }
            }
        }

        if (node.properties.acl && node.properties.acl.length > 0) {
            for (const ac of node.properties.acl) {
                if (ac.gid) {
                    aclGroups.push(`group:${await api.auth.gname(ac.gid)}:${utils.modeString(ac.mode, { acl: true })}`);
                }
            }
        }

        const users = `\n${aclUsers.join("\n")}`;
        const groups = `\n${aclGroups.join("\n")}`;

        await streams.stdout.write(`# file ${abspath}\n`);
        await streams.stdout.write(`# owner: ${uname}\n`);
        await streams.stdout.write(`# group: ${gname}\n`);
        await streams.stdout.write(`user::${umode} ${aclUsers.length > 0 ? users : ""}\n`);
        await streams.stdout.write(`group::${gmode} ${aclGroups.length > 0 ? groups : ""}\n`);
        await streams.stdout.write(`other::${omode}\n`);
    },
    completion: async (term, cmd, name, value) => {
        if (name === "path") {
            return await term.completePath(value);
        }

        return [];
    }
};
