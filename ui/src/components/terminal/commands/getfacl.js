
import { cmd } from "lib/backend";
import utils from "lib/utils";

export default {
    desc: "Print node ACL",
    args: [ "path" ],
    exec: async (term, streams, command, opts, args) => {
        const abspath = await term.getAbspath(args.path, false);
        const node = await cmd.resolve(abspath, { nofollow: true });
        const uname = await cmd.uid(node.properties.uid);
        const gname = await cmd.gid(node.properties.gid);
        const umode = utils.modeString(node.properties.mode, { owner: true });
        const gmode = utils.modeString(node.properties.mode, { group: true });
        const omode = utils.modeString(node.properties.mode, { other: true });
        const aclUsers = [];
        const aclGroups = [];

        if (node.properties.acl && node.properties.acl.length > 0) {
            for (const ac of node.properties.acl) {
                if (ac.uid) {
                    aclUsers.push(`user:${await cmd.uid(ac.uid)}:${utils.modeString(ac.mode, { acl: true })}`);
                }
            }
        }

        if (node.properties.acl && node.properties.acl.length > 0) {
            for (const ac of node.properties.acl) {
                if (ac.gid) {
                    aclGroups.push(`group:${await cmd.gid(ac.gid)}:${utils.modeString(ac.mode, { acl: true })}`);
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
    completion: async (term, command, name, value) => {
        if (name === "path") {
            return await term.completePath(value);
        }

        return [];
    }
};
