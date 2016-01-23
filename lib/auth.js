"use strict";

const co = require("bluebird").coroutine;

module.exports = {
    authenticate: co(function*(username, password) {
        return true;
    })
};
