"use strict";

const Node = require("../../../lib/Node");
const auth = require("../../../auth");
const mode = require("../../../lib/mode");

class Camera extends Node {
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
        await this.createChild(client, "d", "owners");
    }


    // Getters

    static getActionTypes() {
        return super.getActionTypes().concat([
            {
                name: "owners",
                label: "Owners",
                type: "list",
                inputs: [
                    {
                        name: "owner",
                        type: "node",
                        paths: [ "/people" ]
                    }
                ],
                get: "getowners ${this.node.path}", // eslint-disable-line no-template-curly-in-string
                add: "addowner ${this.node.path} ${this.owner.path}", // eslint-disable-line no-template-curly-in-string
                remove: "removeowner ${this.node.path} ${this.remove.path}" // eslint-disable-line no-template-curly-in-string
            }
        ]);
    }

    static getAttributeTypes() {
        return super.getAttributeTypes().concat([
            {
                name: "type",
                label: "Offset type",
                type: "select",
                options: {
                    "offset_fixed": "Fixed",
                    "offset_relative_to_position": "Offset relative to the position"
                }
            },
            {
                name: "utcOffset",
                label: "UTC offset",
                type: "number"
            },
            {
                name: "offsetDescription",
                label: "Offset description",
                type: "textline"
            },
            {
                name: "deviceAutoDst",
                label: "Auto daylight savings",
                type: "boolean"
            },
            {
                name: "serialNumber",
                label: "Serial number",
                type: "textline"
            }
        ]);
    }
}

Camera.IDENTIFIER = "c";
Camera.VERSION = 1;

module.exports = Camera;
