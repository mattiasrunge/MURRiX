"use strict";

const { Node } = require("../../vfs");

class Text extends Node {
    static getAttributeTypes() {
        return [
            {
                name: "when",
                label: "When",
                type: "when"
            }, /*
            {
                name: "where",
                label: "Where",
                type: "where"
            },*/
            {
                name: "text",
                label: "Text",
                type: "text",
                required: true
            }
        ];
    }
}

Text.IDENTIFIER = "t";
Text.VERSION = 1;

module.exports = Text;
