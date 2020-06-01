"use strict";

const assert = require("assert");
const UserGroup = require("./UserGroup");

class UserOrGroup extends UserGroup {
    static async completer(client, partial) {
        // If we have manually written a : after a user
        // we don't want to complete as the super.completer
        // would do
        if (partial.includes(":") && partial[0] !== ":") {
            return [ [ "" ], "" ];
        }

        const [ hits, word ] = await super.completer(client, partial);

        // Since we only want to match user or group we override
        // the completion of a trailing :
        if (word.length === 0 && hits[0] === ":") {
            return [ [ " " ], "" ];
        }

        return [ hits, word ];
    }

    static async validate(client, value) {
        assert(!(value.includes(":") && value[0] !== ":"), "Value is malformed");
    }
}

module.exports = UserOrGroup;
