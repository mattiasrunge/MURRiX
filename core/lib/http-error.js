"use strict";

module.exports = function(message, status) {
    this.name = "HttpError";
    this.message = message;
    this.status = status || 500;
    this.stack = (new Error()).stack;
    this.toString = () => this.name + ": (status " + this.status + ") " + this.message;
};

module.exports.prototype = new Error();
module.exports.prototype.name = "HttpError";
