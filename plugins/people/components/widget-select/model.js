"use strict";

const utils = require("lib/utils");

module.exports = utils.wrapComponent(function*(params) {
    this.id = params.inputId || "random";
    this.personPath = params.personPath;

    this.dispose = () => {
    };
});

// TODO:
// * Move to VFS
// * Make placeholder text configurable
// * Supply search path eg /people and query { properties.type: "p" }
// * Set select by path and select outputs a path
