"use strict";

const moment = require("moment");
const { Node } = require("../../vfs");
const age = require("./age");

module.exports = async (session, year) => {
    year = parseInt(year, 10);
    //
    // console.log("ALBUM BY YEAR ", year);
    //
    // console.time("aggregate");
    //
    // const pipeline = [
    //     {
    //         $match: {
    //             "properties.type": { $in: [ "f", "t" ] },
    //             "attributes.time.timestamp": {
    //                 $gte: moment.utc({ year }).unix(),
    //                 $lt: moment.utc({ year: year + 1 }).unix()
    //             }
    //         }
    //     },
    //     {
    //         $lookup: {
    //             from: "nodes",
    //             localField: "_id",
    //             foreignField: "properties.children.id",
    //             as: "parents"
    //         }
    //     },
    //     {
    //         $unwind: "$parents"
    //     },
    //     {
    //         $replaceRoot: {
    //             newRoot: "$parents"
    //         }
    //     },
    //     {
    //         $group: {
    //             _id: "$_id"
    //         }
    //     },
    //     {
    //         $lookup: {
    //             from: "nodes",
    //             localField: "_id",
    //             foreignField: "properties.children.id",
    //             as: "parents"
    //         }
    //     },
    //     {
    //         $unwind: "$parents"
    //     },
    //     {
    //         $replaceRoot: {
    //             newRoot: "$parents"
    //         }
    //     },
    //     {
    //         $match: {
    //             "properties.type": "a"
    //         }
    //     },
    //     {
    //         $project: {
    //             _id: 1
    //         }
    //     }
    // ];
    //
    // // console.log(JSON.stringify(pipeline, null, 2));
    //
    // console.time("1");
    // const cursor = await Node.aggregate(session, pipeline);
    // const ids = await cursor.toArray();
    // console.timeEnd("1");
    //
    // console.time("2");
    // const promises = ids.map((node) => Node.lookup(session, node._id));
    // const list = await Promise.all(promises);
    // const nodeHash = {};
    // const result = [];
    // console.timeEnd("2");
    //
    // console.time("3");
    // for (const nodes of list) {
    //     for (const node of nodes) {
    //         if (node && !nodeHash[node._id]) {
    //             result.push(node);
    //             nodeHash[node._id] = true;
    //         }
    //     }
    // }
    // console.timeEnd("3");
    //
    // console.time("4");
    // let serialized = await Promise.all(result.map((node) => node.serialize(session)));
    // console.timeEnd("4");
    //
    // console.log("Result", serialized.length);
    //
    // console.timeEnd("aggregate");
    //
    // // return serialized;
    //
    //

    // console.time("query");

    const options = {
        fields: {
            "_id": 1
        },
        nolookup: true
    };

    // console.time("1");
    const ftNodes = await Node.query(session, {
        "properties.type": { $in: [ "f", "t" ] },
        "attributes.time.timestamp": {
            $gte: moment.utc({ year }).unix(),
            $lt: moment.utc({ year: year + 1 }).unix()
        }
    }, options);
    const ftIds = ftNodes.map((node) => node._id);
    // console.timeEnd("1");

    // console.time("2");
    const dNodes = await Node.query(session, {
        "properties.type": "d",
        "properties.children.id": { $in: ftIds }
    }, options);
    const dIds = dNodes.map((node) => node._id);
    // console.timeEnd("2");

    // console.time("3");
    const nodes = await Node.query(session, {
        "properties.type": "a",
        "properties.children.id": { $in: dIds }
    });
    // console.timeEnd("3");

    for (const node of nodes) {
        node.extra.age = await age(session, node.path, { timestamp: moment.utc({ year }).unix() });
    }

    // console.time("4");
    const serialized = await Promise.all(nodes.map((node) => node.serialize(session)));
    // console.timeEnd("4");

    // console.log("Result", serialized.length);

    // console.timeEnd("query");

    return serialized;
};
