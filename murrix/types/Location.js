"use strict";

const { Node } = require("../../vfs");

class Location extends Node {
    // Private

    async _postCreate(session) {
        await this.createChild(session, "d", "residents");
        await this.createChild(session, "d", "texts");
    }


    // Getters

    static getAttributeTypes() {
        return super.getAttributeTypes().concat([
            {
                name: "address",
                label: "Address",
                type: "text"
            },
            {
                name: "owners",
                label: "Owners",
                type: "cmd",
                inputs: {
                    owner: "select"
                },
                get: "getowners {node.path}",
                add: "addowner {node.path} {owner.path}",
                remove: "removeowner {node.path} {owner.path}"
            }
        ]);
    }
}

Location.IDENTIFIER = "l";
Location.VERSION = 1;

module.exports = Location;
