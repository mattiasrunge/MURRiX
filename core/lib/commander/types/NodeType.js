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

        return [ await api.nodetypes(client, true), partial ];
    }

    static async validate(client, value) {
        const types = await api.nodetypes(client, true);

        assert(value.length === 1, "node type should be one letter long");
        assert(types.includes(value), `allowed types are: ${types.join(", ")}`);
    }
}

module.exports = NodeType;
