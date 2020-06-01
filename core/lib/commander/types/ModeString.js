"use strict";

const assert = require("assert");
const Generic = require("./Generic");

const modeStringRegexp = new RegExp(/^(?!.*(.).*\1)[rwx]+$/);

class ModeString extends Generic {
    static async completer(client, partial) {
        if (partial.length === 3) {
            return [ [ " " ], "" ];
        }

        if (partial.length > 3) {
            return [ [], partial ];
        }

        const hits = [];

        !partial.includes("r") && hits.push("r");
        !partial.includes("w") && hits.push("w");
        !partial.includes("x") && hits.push("x");

        return [ hits, partial ];
    }

    static async validate(client, value) {
        const str = `${value}`;

        assert(str.length <= 3, "mode string can not be larger than 3");
        assert(modeStringRegexp.test(str), "mode can only consist of r, w and x");
    }
}

module.exports = ModeString;
