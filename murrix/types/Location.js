"use strict";

const { Node } = require("../../vfs");

class Location extends Node {
    static getAttributeTypes() {
        return super.getAttributeTypes().concat([
            {
                name: "address",
                label: "Address",
                type: "text"
            }
        ]);
    }
}

Location.IDENTIFIER = "l";
Location.VERSION = 1;

module.exports = Location;
