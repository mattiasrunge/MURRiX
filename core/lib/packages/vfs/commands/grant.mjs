import { MASKS, getMode } from "../../../lib/mode.mjs";
import { api } from "../../../api/index.mjs";

export default async (client, term,
    // Grant access (ACL) to user or group for node
    //
    // Who:
    // <user>
    // :<group>
    opts, // r Recursive grant
    mode, // ModeString
    who, // UserOrGroup
    abspath // AbsolutePath
) => {
    const ac = {
        mode: getMode(mode, MASKS.ACL)
    };

    if (who.uid) {
        ac.uid = who.uid;
    } else if (who.gid) {
        ac.gid = who.gid;
    }

    await api.setfacl(client, abspath, ac, {
        recursive: opts.r
    });
};
