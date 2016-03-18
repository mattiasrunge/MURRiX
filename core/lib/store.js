"use strict";

let storage = {};

module.exports = {
    create: (name) => {
        storage[name] = {};
    },
    get: (store, name) => {
        return storage[store][name];
    },
    set: (store, name, value) => {
        storage[store][name] = value;
    },
    unset: (store, name) => {
        delete storage[store][name];
    }
};
