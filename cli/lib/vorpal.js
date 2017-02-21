"use strict";

const less = require("vorpal-less");

module.exports = require("vorpal")();

module.exports.use(less);

module.exports.wrap = function(fn) {
    return async (args) => {
        try {
            this.promptAsync = (options) => {
                return new Promise((resolve) => {
                    this.prompt(options, resolve);
                });
            };

            await fn(this, module.exports.cliSession, args);
        } catch (e) {
            if (typeof e === "string") {
                this.log(e.split("\n")[0].replace(/^Error: /, "").red);
            } else {
                this.log(e.message.replace(/^Error: /, "").red);
            }

            this.log(e.toString().red);
        }
    };
};
