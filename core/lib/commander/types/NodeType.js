"use strict";

const assert = require("assert");
const { api } = require("../../api");
const Generic = require("./Generic");

class NodeType extends Generic {
    static async completer(client, partial) {
        if (partial.length === 1) {
            return [ [ " " ], "" ];
        }

        if (partial.length > 1) {
            return [ [], partial ];
        }

        return [ api.nodetypes(client, true), partial ];
    }

    static async validate(client, value) {
        assert(value.length === 1, "node type should be one letter long");
        assert(api.nodetypes(client, true).includes(value), `allowed types are: ${api.nodetypes(client, true).join(", ")}`);
    }
}

module.exports = NodeType;
