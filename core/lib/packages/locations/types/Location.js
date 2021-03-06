"use strict";

const Node = require("../../../lib/Node");
const auth = require("../../../auth");
const mode = require("../../../lib/mode");

class Location extends Node {
    // Private

    static async _createData(client, parent, type, attributes = {}) {
        const data = await super._createData(client, parent, type, attributes);

        data.properties.acl.push({
            gid: auth.GID_CUSTODIANS,
            uid: null,
            mode: mode.getMode("rwx", mode.MASKS.ACL)
        });

        return data;
    }

    async _postCreate(client) {
        await this.createChild(client, "d", "residents");
        await this.createChild(client, "d", "texts");
    }


    // Getters

    static getActionTypes() {
        return super.getActionTypes().concat([
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
        ]);
    }

    static getAttributeTypes() {
        return super.getAttributeTypes().concat([
            {
                name: "where",
                label: "Position",
                type: "where"
            }
        ]);
    }
}

Location.IDENTIFIER = "l";
Location.VERSION = 1;

module.exports = Location;
