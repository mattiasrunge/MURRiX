"use strict";

const MongoClient = require("mongodb").MongoClient;
const co = require("bluebird").coroutine;

let db = null;

module.exports = {
    init: co(function*(config) {
        let url = config.mongoUrl;

        db = yield MongoClient.connect(url);
    }),
    find: (collectionName, query, options) => {
        let collection = db.collection(collectionName);

        return collection.find(query, options).toArray();
    },
    findOne: (collectionName, query, options) => {
        let collection = db.collection(collectionName);

        return collection.findOne(query, options);
    },
    insertOne: (collectionName, doc, options) => {
        let collection = db.collection(collectionName);

        return collection.insertOne(doc, options);
    },
    updateOne: (collectionName, doc, options) => {
        let collection = db.collection(collectionName);

        return collection.updateOne({ _id: doc._id }, doc, options);
    },
    removeOne: (collectionName, id, options) => {
        let collection = db.collection(collectionName);

        return collection.deleteOne({ _id: id }, options);
    }
};
