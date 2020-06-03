"use strict";

const Node = require("../../../lib/Node");

class Text extends Node {
    static getAttributeTypes() {
        return [
            {
                name: "name",
                label: "Name",
                type: "textline",
                required: true
            },
            {
                name: "type",
                label: "Type",
                type: "select",
                options: {
                    generic: "Generic",
                    birth: "Birth",
                    engagement: "Engagement",
                    marriage: "Marriage",
                    death: "Death"
                }
            },
            {
                name: "when",
                label: "When",
                type: "when"
            },
            {
                name: "where",
                label: "Position",
                type: "where"
            },
            {
                name: "text",
                label: "Text",
                type: "text"
            }
        ];
    }
}

Text.IDENTIFIER = "t";
Text.VERSION = 1;

module.exports = Text;
