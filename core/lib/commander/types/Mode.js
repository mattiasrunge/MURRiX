"use strict";

const assert = require("assert");
const Generic = require("./Generic");

const modeNumberRegexp = new RegExp("^[0-7]+$");

class Mode extends Generic {
    static async completer(client, partial) {
        if (partial.length === 3) {
            return [ [ " " ], "" ];
        }

        if (partial.length > 3) {
            return [ [], partial ];
        }

        return [ [ "0", "1", "2", "3", "4", "5", "6", "7" ], partial ];
    }

    static async validate(client, value) {
        const str = `${value}`;

        assert(str.length === 3, "mode must be 3 numbers");
        assert(modeNumberRegexp.test(str[0]), "mode must be 3 numbers between 0 and 7");
        assert(modeNumberRegexp.test(str[1]), "mode must be 3 numbers between 0 and 7");
        assert(modeNumberRegexp.test(str[2]), "mode must be 3 numbers between 0 and 7");
    }

    static async transform(client, value) {
        const str = `${value}`;

        return Number.parseInt(str, 8);
    }
}

module.exports = Mode;
