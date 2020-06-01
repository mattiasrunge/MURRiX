"use strict";

const assert = require("assert");

class Api {
    constructor() {
        this.api = {};
    }

    register(name, fn) {
        assert(!this.api[name], `A api with the name ${name} is already registered`);

        this.api[name] = fn;
    }
}

module.exports = new Api();
