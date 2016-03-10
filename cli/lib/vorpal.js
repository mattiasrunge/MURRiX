"use strict";

const co = require("bluebird").coroutine;

module.exports = require("vorpal")();

module.exports.wrap = function(fn) {
    return co(function*(args) {
        try {
            this.promptAsync = (options) => {
                return new Promise((resolve) => {
                    this.prompt(options, resolve);
                });
            };

            yield co(fn.bind(this))(args);
        } catch (e) {
            this.log(e);
            if (typeof e === "string") {
                this.log(e.split("\n")[0].replace(/^Error: /, "").red);
            } else {
                this.log(e.message.replace(/^Error: /, "").red);
            }
        }
    });
};
