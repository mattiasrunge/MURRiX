"use strict";

const utils = require("lib/utils");
const ui = require("lib/ui");

module.exports = utils.wrapComponent(function*(/*params*/) {
    ui.setTitle("Recent");

    this.dispose = () => {
    };
});
