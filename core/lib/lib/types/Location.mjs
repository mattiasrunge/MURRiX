import Node from "../Node.mjs";
import { GID_CUSTODIANS } from "../../auth/index.mjs";
import { getMode, MASKS } from "../mode.mjs";

class Location extends Node {
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
        await this.createChild(client, "d", "residents");
        await this.createChild(client, "d", "texts");
    }


    // Getters

    static getActionTypes() {
        return [ ...super.getActionTypes(),
            {
                name: "residents",
                label: "Residents",
                type: "list",
                inputs: [
                    {
                        name: "resident",
                        type: "node",
                        paths: [ "/people" ]
                    }
                ],
                get: "getresidents ${this.node.path}", // eslint-disable-line no-template-curly-in-string
                add: "addresident ${this.node.path} ${this.resident.path}", // eslint-disable-line no-template-curly-in-string
                remove: "removeresident ${this.node.path} ${this.remove.path}" // eslint-disable-line no-template-curly-in-string
            }
        ];
    }

    static getAttributeTypes() {
        return [ ...super.getAttributeTypes(),
            {
                name: "where",
                label: "Position",
                type: "where"
            }
        ];
    }
}

Location.IDENTIFIER = "l";
Location.VERSION = 1;

export default Location;
