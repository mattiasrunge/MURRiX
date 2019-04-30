"use strict";

const Node = require("../../../core/Node");
const auth = require("../../../core/auth");
const mode = require("../../../core/mode");

class Location extends Node {
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
        await this.createChild(session, "d", "residents");
        await this.createChild(session, "d", "texts");
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
                get: "murrix.getresidents $this.path",
                add: "murrix.addresident $this.path $resident.path",
                remove: "murrix.removeresident $this.path $remove.path"
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
