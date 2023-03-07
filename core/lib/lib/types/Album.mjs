import Node from "../Node.mjs";
import { GID_CUSTODIANS } from "../../auth/index.mjs";
import { getMode, MASKS } from "../mode.mjs";

class Album extends Node {
    // Private

    static async _createData(client, parent, type, attributes = {}) {
        const data = await super._createData(client, parent, type, attributes);

        data.properties.acl.push({
            gid: GID_CUSTODIANS,
            uid: null,
            mode: getMode("rwx", MASKS.ACL)
        });

        return data;
    }

    async _postCreate(client) {
        await this.createChild(client, "d", "files");
        await this.createChild(client, "d", "texts");
    }
}

Album.IDENTIFIER = "a";
Album.VERSION = 1;

export default Album;
