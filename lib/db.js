"use strict";

const MongoClient = require("mongodb").MongoClient;
const co = require("bluebird").coroutine;

let db = null;

module.exports = {
    init: co(function*() {
        let url = "mongodb://localhost:27017/murrix_test_20160122";

        db = yield MongoClient.connect(url);
    }),
    find: function(collectionName, query) {
        let collection = db.collection(collectionName);

        return collection.find(query).toArray();
    },
    findOne: function(collectionName, query) {
        let collection = db.collection(collectionName);

        return collection.findOne(query);
    },
    insertOne: function(collectionName, doc) {
        let collection = db.collection(collectionName);

        return collection.insertOne(doc);
    },
    updateOne: function(collectionName, doc) {
        let collection = db.collection(collectionName);

        return collection.updateOne({ _id: doc._id }, doc);
    },
    removeOne: function(collectionName, id) {
        let collection = db.collection(collectionName);

        return collection.deleteOne({ _id: id });
    }
};
