"use strict";

const assert = require("assert");
const Node = require("../../core/Node");
const Generic = require("./Generic");

class NodeType extends Generic {
    static async completer(client, partial) {
        if (partial.length === 1) {
            return [ [ " " ], "" ];
        }

        if (partial.length > 1) {
            return [ [], partial ];
        }

        return [ Node.getTypes(true), partial ];
    }

    static async validate(client, value) {
        assert(value.length === 1, "node type should be one letter long");
        assert(Node.getTypes(true).includes(value), `allowed types are: ${Node.getTypes(true).join(", ")}`);
    }
}

module.exports = NodeType;
