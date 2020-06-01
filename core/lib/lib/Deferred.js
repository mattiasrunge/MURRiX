
"use strict";

class Deferred {
    constructor(resolved = false) {
        this.resolved = resolved;

        this.promise = new Promise((resolve, reject) => {
            this.resolve = (data) => {
                this.resolved = true;
                resolve(data);
            };

            this.reject = (data) => {
                this.resolved = true;
                reject(data);
            };
        });

        this.resolved && this.resolve();
    }
}

module.exports = Deferred;
