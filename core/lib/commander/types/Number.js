"use strict";

const assert = require("assert");
const Generic = require("./Generic");

class Number2 extends Generic {
    static async validate(client, value) {
        assert(!Number.isNaN(Number.parseInt(value, 10)), `${value} is not a number`);
    }

    static async transform(client, value) {
        return Number.parseInt(value, 10);
    }
}

module.exports = Number2;
