"use strict";

// TODO: Most methods here are unneccessary, remove!

const path = require("path");
const { MongoClient } = require("mongodb");
const configuration = require("../config");
const { History } = require("db-history");

class Database {
    constructor() {
        this.db = null;
        this.client = null;
        this.history = null;
    }

    async init() {
        const url = configuration.mongoUrl;

        this.client = await MongoClient.connect(url, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        this.db = this.client.db(path.basename(url));

        if (configuration.historyDirectory) {
            this.history = new History(configuration.historyDirectory);
        }
    }

    createIndexes(collectionName, indexes) {
        const collection = this.db.collection(collectionName);

        return collection.createIndexes(indexes);
    }

    dropDatabase() {
        return this.db.dropDatabase();
    }

    find(collectionName, query, options) {
        const collection = this.db.collection(collectionName);

        let cursor = collection.find(query, options);

        if (options && options.sort) {
            cursor = cursor.sort(options.sort);
        }

        if (options && options.skip) {
            cursor = cursor.skip(options.skip);
        }

        if (options && options.limit) {
            cursor = cursor.limit(options.limit);
        }

        return cursor.toArray();
    }

    findOne(collectionName, query, options) {
        const collection = this.db.collection(collectionName);

        return collection.findOne(query, options);
    }

    findOneAndUpdate(collectionName, query, update, options) {
        const collection = this.db.collection(collectionName);

        return collection.findOneAndUpdate(query, update, options);
    }

    insertOne(collectionName, doc, options) {
        const collection = this.db.collection(collectionName);

        return collection.insertOne(doc, options);
    }

    updateOne(collectionName, doc, options) {
        const collection = this.db.collection(collectionName);

        return collection.updateOne({ _id: doc._id }, { $set: doc }, options);
    }

    removeOne(collectionName, id, options) {
        const collection = this.db.collection(collectionName);

        return collection.deleteOne({ _id: id }, options);
    }

    distinct(collectionName, attribute) {
        const collection = this.db.collection(collectionName);

        return collection.distinct(attribute);
    }

    aggregate(collectionName, pipeline) {
        const collection = this.db.collection(collectionName);

        return collection.aggregate(pipeline);
    }

    countDocuments(collectionName, query, options) {
        const collection = this.db.collection(collectionName);

        return collection.countDocuments(query, options);
    }

    async stop() {
        this.client.close();
    }

    async createInstance(config) {
        const db = new Database();
        await db.init(config);

        return db;
    }
}

module.exports = new Database();
