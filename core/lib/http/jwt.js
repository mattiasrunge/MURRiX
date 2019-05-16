"use strict";

const jwt = require("jsonwebtoken");

class Jwt {
    constructor() {
        this.key = "secret"; // TODO
    }

    async encode(data) {
        return new Promise((resolve, reject) => jwt.sign({ ...data }, this.key, (error, token) => {
            if (error) {
                return reject(error);
            }

            resolve(token);
        }));
    }

    async decode(token) {
        return new Promise((resolve, reject) => jwt.verify(token, this.key, (error, decoded) => {
            if (error) {
                return reject(error);
            }

            resolve(decoded);
        }));
    }
}

module.exports = new Jwt();
