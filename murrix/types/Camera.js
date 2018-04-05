"use strict";

const { Node } = require("../../vfs");

class Camera extends Node {
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
