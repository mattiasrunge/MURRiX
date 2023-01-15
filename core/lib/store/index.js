"use strict";

const redis = require("redis");
const configuration = require("../config");

class Store {
    async init() {
        const url = configuration.redisUrl;

        this.client = redis.createClient();
        await this.client.connect(url);
    }

    isConnected() {
        return !!(this.client && this.client.isReady);
    }

    async set(key, obj) {
        console.log("redis-set", key, obj);
        const ok = await this.client.set(key, JSON.stringify(obj));

        if (ok !== "OK") {
            throw new Error(`Failed to set in redis, ${ok}`);
        }
    }

    async get(key) {
        console.log("redis-get", key);
        const value = await this.client.get(key);

        if (value) {
            return JSON.parse(value);
        }

        return value;
    }

    async unset(key) {
        console.log("redis-unset", key);
        await this.client.del(key);
    }

    async stop() {
        await this.client.quit();

        this.client = null;
    }
}

module.exports = new Store();
