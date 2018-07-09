"use strict";

const { Node } = require("../../vfs");

class Location extends Node {
    // Private

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
}

Location.IDENTIFIER = "l";
Location.VERSION = 1;

module.exports = Location;
