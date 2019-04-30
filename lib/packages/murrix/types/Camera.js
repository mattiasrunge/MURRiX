"use strict";

const Node = require("../../../core/Node");
const auth = require("../../../core/auth");
const mode = require("../../../core/mode");

class Camera extends Node {
    // Private

    static async _createData(session, parent, type, attributes = {}) {
        const data = await super._createData(session, parent, type, attributes);

        data.properties.acl.push({
            gid: auth.GID_CUSTODIANS,
            uid: null,
            mode: mode.getMode("rwx", mode.MASKS.ACL)
        });

        return data;
    }

    async _postCreate(session) {
        await this.createChild(session, "d", "owners");
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
                get: "murrix.getowners $this.path",
                add: "murrix.addowner $this.path $owner.path",
                remove: "murrix.removeowner $this.path $remove.path"
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
