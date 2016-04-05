"use strict";

const MongoClient = require("mongodb").MongoClient;
const co = require("bluebird").coroutine;

let Database = function() {
    let db = null;

    this.init = co(function*(config) {
        let url = config.mongoUrl;

        db = yield MongoClient.connect(url);
    });

    this.find = (collectionName, query, options) => {
        let collection = db.collection(collectionName);

        return collection.find(query, options).toArray();
    };

    this.findOne = (collectionName, query, options) => {
        let collection = db.collection(collectionName);

        return collection.findOne(query, options);
    };

    this.insertOne = (collectionName, doc, options) => {
        let collection = db.collection(collectionName);

        return collection.insertOne(doc, options);
    };

    this.updateOne = (collectionName, doc, options) => {
        let collection = db.collection(collectionName);

        return collection.updateOne({ _id: doc._id }, doc, options);
    };

    this.removeOne = (collectionName, id, options) => {
        let collection = db.collection(collectionName);

        return collection.deleteOne({ _id: id }, options);
    };

    this.stop = co(function*() {
        db.close();
    });

    this.createInstance = co(function*(config) {
        let db = new Database();
        yield db.init(config);
        return db;
    });
};

module.exports = new Database();
