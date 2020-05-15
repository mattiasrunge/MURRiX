"use strict";

/* jshint -W035 */
// jscs:disable

const path = require("path");
const moment = require("moment");
const api = require("api.io");
const database = require("../../core/lib/db");

let params = {};

const update = api.register("update", {
    deps: [ "vfs", "auth", "people", "location", "album", "file", "text", "camera" ],
    init: async (config) => {
        params = config;
    },
    import: api.export(async (session, dbname, filepath, copyMode) => {
        if (session.username !== "admin") {
            throw new Error("Permission denied");
        }

        let db = await database.createInstance({ mongoUrl: "mongodb://localhost:27017/" + dbname });
        let result = {
            groups: 0,
            users: 0,
            people: 0,
            locations: 0,
            cameras: 0,
            albums: 0,
            measurments: 0,
            files: 0,
            texts: 0,
            missingFiles: []
        };
        let idTransNodes = {};
        let idTransItems = {};
        let idTransGroups = {};
        let idTransGroupsGid = {};
        let idTransUsers = {};
        let idTransUsersUid = {};
        let index = 0;

        let uniqueNames = {};

        const getUniqueName = (listName, baseName) => {
            uniqueNames[listName] = uniqueNames[listName] || [];

            let counter = 1;
            let name = baseName.replace(/ |\//g, "_");
            while (uniqueNames[listName].includes(name)) {
                name = baseName.replace(/ |\//g, "_") + "_" + counter;
                counter++;
            }

            uniqueNames[listName].push(name);
            return name;
        };

        // First pass
        console.log("First pass!");

        // Import groups
        let groupList = await db.find("groups");

        /*
        {
        *    "_id" : "<id>",
        *    "name" : "Administrators",
        *    "description" : "",
        *    "added" : {
        *            "timestamp" : 1359332861,
        *            "_by" : "<id>"
        *    }
        }
        */

        console.log("Found " + groupList.length + " groups");

        index = 0;
        for (let obj of groupList) {
            index++;

            if (obj.name === "Administrators") {
                idTransGroups[obj._id] = "admin";
                result.groups++;
                continue;
            } else if (obj.name === "Users") {
                idTransGroups[obj._id] = "users";
                result.groups++;
                continue;
            }

            let name = obj.name.replace(/ /g, "_").toLowerCase();

            console.log(index + "/" + groupList.length + ": Importing group " + name);

            let group = await api.auth.mkgroup(session, name, obj.name, obj.description);
            await api.vfs.setproperties(session, "/groups/" + name, {
                birthtime: moment(obj.added.timestamp * 1000).toDate()
            });

            idTransGroups[obj._id] = name;
            idTransGroupsGid[obj._id] = group.attributes.gid;
            result.groups++;
        }


        // Import users
        let userList = await db.find("users");

        /*
        {
        *    "_id" : "<id>",
        *    "_groups" : [
        *            "<id>",
        *            "<id>",
        *            "<id>",
        *            "<id>",
        *            "<id>",
        *            "<id>",
        *            "<id>",
        *            "<id>"
        *    ],
        *    "_person" : "<id>",
        *    "added" : {
        *            "timestamp" : 1439495333,
        *            "_by" : "<id>"
        *    },
        *    "admin" : false,
        *    "email" : "<email>",
        *    "lastLogin" : 1459359030,
        *    "modified" : { <- Ignore, import is modified
        *            "timestamp" : 1439505049,
        *            "_by" : "<id>"
        *    },
        *    "name" : "<name>",
        *    "password" : "<hash>",
        *    "username" : "<username>"
        }
        */

        console.log("Found " + userList.length + " users");

        index = 0;
        for (let obj of userList) {
            index++;
            if (obj.username === "admin") {
                idTransUsers[obj._id] = "admin";
                idTransUsersUid[obj._id] = 1000;
                result.users++;
                continue;
            }

            if (obj.username === "anonymous") {
                idTransUsers[obj._id] = "guest";
                idTransUsersUid[obj._id] = 1001;
                result.users++;
                continue;
            }

            let name = obj.email ? obj.email : obj.username;

            console.log(index + "/" + userList.length + ": Importing user " + name);

            let user = await api.auth.mkuser(session, name, obj.name);
            await api.vfs.setattributes(session, "/users/" + name, {
                password: obj.password,
                usernameV1: obj.username,
                loginTime: moment(obj.lastLogin * 1000).toDate()
            });
            await api.vfs.setproperties(session, "/users/" + name, {
                birthtime: moment(obj.added.timestamp * 1000).toDate()
            });

            for (let groupId of obj._groups) {
                if (idTransGroups[groupId] !== "users") {
                    try {
                        await api.auth.connect(session, name, idTransGroups[groupId]);
                    } catch (e) {
                        console.error(e);
                    }
                }
            }

            if (obj.admin) {
                await api.auth.connect(session, name, "admin");
            }

            idTransUsers[obj._id] = name;
            idTransUsersUid[obj._id] = user.attributes.uid;
            result.users++;
        }


        /* From here we start importing content and should use a different umask */

        let umask = session.umask;
        session.umask = 0o770;


        // Import persons
        let peopleList = await db.find("nodes", { type: "person" });

        /*
        {
        *    "_id" : "<id>",
        *    "name" : "<id>",
        *    "oldNodeId" : <id>,
        *    "type" : "person",
        *    "added" : {
        *            "timestamp" : 1237650665,
        *            "_by" : "<id>"
        *    },
        *    "modified" : { <- Ignore, import is modified
        *            "timestamp" : 1447421558,
        *            "_by" : "<id>"
        *    },
        *    "comments" : [
        *        {
        *            "added" : {
        *                "timestamp" : 1363450833,
        *                "_by" : "<id>"
        *            },
        *            "text" : "Hello world."
        *        }
        *    ],
            "_admins" : [
                    "<id>"
            ],
            "_readers" : [
                    "<id>"
            ],
            "public" : false,
        *    "tags" : [
        *            "<tag>",
        *            "<tag>",
        *            "<tag>",
        *            "<tag>"
        *    ],
        *    "removed" : false,
        *    "_profilePicture" : "<id>",
        *    "description" : "Hello World.",
        *    "fullname" : "<name>",
        *    "birthname" : "<name>",
        *    "gender" : "m",
        *    "allergies" : "",
        *    "contact" : "home:<data>\nmobile:<data>\nemail:<data>\nemail:<data>\nicq:<data>\nmsn:<data>\nskype:<data>",
        *    "_homes" : [
        *            "<id>"
        *    ],
        *    "family" : {
        *            "parents" : [
        *                    {
        *                            "_id" : "<id>",
        *                            "type" : "blod"
        *                    },
        *                    {
        *                            "_id" : "<id>",
        *                            "type" : "blod"
        *                    }
        *            ],
        *            "_partner" : "<id>"
        *    }
        }
        */

        console.log("Found " + peopleList.length + " people");

        index = 0;
        for (let obj of peopleList) {
            index++;
            if (obj.removed) {
                continue;
            }

            let name = getUniqueName("people", obj.name);
            let attributes = {
                name: obj.name,
                fullname: obj.fullname,
                birthname: obj.birthname,
                allergies: obj.allergies,
                gender: obj.gender,
                contact: obj.contact ? obj.contact.split("\n").map((item) => {
                    let parts = item.split(":");
                    return { type: parts[0], data: parts[1] };
                }) : [],
                description: obj.description,
                idV0: obj.oldNodeId,
                idV1: obj._id,
                labels: obj.tags || []
            };

            console.log(index + "/" + peopleList.length + ": Importing person " + name);

            await api.people.mkperson(session, name, attributes);
            await api.vfs.setproperties(session, "/people/" + name, {
                birthtime: moment(obj.added.timestamp * 1000).toDate(),
                birthuid: idTransUsersUid[obj.added._by]
            });

            if (obj.comments && obj.comments.length > 0) {
                await api.vfs.ensure(session, "/people/" + name + "/comments", "d");

                for (let comment of obj.comments) {
                    let name2 = moment(comment.added.timestamp * 1000).format();

                    await api.vfs.create(session, "/people/" + name + "/comments/" + name2, "c", {
                        text: comment.text
                    });
                    await api.vfs.setproperties(session, "/people/" + name + "/comments/" + name2, {
                        birthtime: moment(comment.added.timestamp * 1000).toDate(),
                        birthuid: idTransUsersUid[comment.added._by]
                    });
                }
            }


            idTransNodes[obj._id] = "/people/" + name;
            result.people++;
        }


        // Import locations
        let locationList = await db.find("nodes", { type: "location" });

        /*
        {
        *    "_id" : "<id>",
        *    "name" : "<name>",
        *    "oldNodeId" : <id>,
        *    "type" : "location",
        *    "added" : {
        *            "timestamp" : 1222898997,
        *            "_by" : "<id>"
        *    },
        *    "modified" : { <- Ignore, import is modified
        *            "timestamp" : 1222898997,
        *            "_by" : "<id>"
        *    },
        *    "comments" : [ ],
            "_admins" : [
                    "<id>"
            ],
            "_readers" : [
                    "<id>"
            ],
            "public" : false,
        *    "tags" : [ ],
        *    "removed" : false,
        *    "_profilePicture" : false,
        *    "description" : "",
        *    "address" : ""
        }
        */

        console.log("Found " + locationList.length + " locations");

        index = 0;
        for (let obj of locationList) {
            index++;

            if (obj.removed) {
                continue;
            }

            obj.name = obj.name.trim();

            let name = getUniqueName("locations", obj.name);
            let attributes = {
                name: obj.name,
                address: (obj.address || "").replace(/\r/g, ""),
                description: obj.description,
                idV0: obj.oldNodeId,
                idV1: obj._id,
                labels: obj.tags || []
            };

            console.log(index + "/" + locationList.length + ": Importing location " + name);

            await api.location.mklocation(session, name, attributes);
            await api.vfs.setproperties(session, "/locations/" + name, {
                birthtime: moment(obj.added.timestamp * 1000).toDate(),
                birthuid: idTransUsersUid[obj.added._by]
            });

            if (obj.comments && obj.comments.length > 0) {
                await api.vfs.ensure(session, "/locations/" + name + "/comments", "d");

                for (let comment of obj.comments) {
                    let name2 = moment(comment.added.timestamp * 1000).format();

                    await api.vfs.create(session, "/locations/" + name + "/comments/" + name2, "c", {
                        text: comment.text
                    });
                    await api.vfs.setproperties(session, "/locations/" + name + "/comments/" + name2, {
                        birthtime: moment(comment.added.timestamp * 1000).toDate(),
                        birthuid: idTransUsersUid[comment.added._by]
                    });
                }
            }

            idTransNodes[obj._id] = "/locations/" + name;
            result.locations++;
        }



        // Import cameras
        let cameraList = await db.find("nodes", { type: "camera" });

        /*
        {
            *"_id" : "<id>",
            *"type" : "camera",
            *"name" : "<name>",
            *"description" : "Hello World.",
            *"mode" : "manual",
            "_owner" : "<id>",
            "referenceTimelines" : [
                {
                    "_id" : "defaultTimezone",
                    "type" : "timezone",
                    "name" : "(GMT+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna"
                }
            ],
            "added" : {
                "timestamp" : 1358978016,
                "_by" : "<id>"
            },
            "modified" : {
                "timestamp" : 1359233952,
                "_by" : "<id>"
            },
            *"comments" : [ ],
            "_admins" : [ ],
            "_readers" : [ ],
            "public" : false,
            *"tags" : [ ],
            *"removed" : false,
            *"_profilePicture" : false,
            *"_owners" : [
            *    "<id>",
            *    "<id>"
            *]
        }

        {
            "_id" : "<id>",
            "type" : "camera",
            "name" : "<name>",
            "serial" : "<serial>",
            "tracker_id" : "",
            "description" : "",
            "_owners" : [
                    "<id>"
            ],
            "mode" : "manual",
            "referenceTimelines" : [
                {
                    "_id" : "<id>",
                    "type" : "utc",
                    "offset" : -7190,
                    "name" : "(UTC -7190s) from ....JPG"
                },
                {
                    "_id" : "defaultTimezone",
                    "type" : "timezone",
                    "name" : "(GMT+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna"
                }
            ],
            "added" : {
                "timestamp" : 1377256868,
                "_by" : "<id>"
            },
            "modified" : {
                "timestamp" : 1377269140,
                "_by" : "<id>"
            },
            "comments" : [ ],
            "_admins" : [
                "<id>"
            ],
            "_readers" : [
                "<id>"
            ],
            "public" : false,
            "tags" : [ ],
            "removed" : false,
            "_profilePicture" : false
        }
        */

        console.log("Found " + cameraList.length + " cameras");

        index = 0;
        for (let obj of cameraList) {
            index++;

            if (obj.removed) {
                continue;
            }

            obj.name = obj.name.trim();

            let name = getUniqueName("cameras", obj.name);
            let abspath = "/cameras/" + name;
            let attributes = {
                name: obj.name,
                description: obj.description,
                idV0: obj.oldNodeId,
                idV1: obj._id,
                serialNumber: obj.serial + "",
                labels: obj.tags || [],
                type: obj.mode === "autoDatetime" ? "offset_relative_to_position" : "offset_fixed",
                deviceAutoDst: false
            };

            if (attributes.type === "offset_fixed" && obj.referenceTimelines.length > 0) {
                let ref = obj.referenceTimelines[0];

                if (ref.type === "utc") {
                    attributes.utcOffset = ref.offset;
                    attributes.offsetDescription = ref.name;
                } else if (ref.type === "timezone") {
                    let timezone = ref.name.match(/\(GMT(.*?)\).*/)[1] || "+00:00";

                    let sign = timezone[0] === "-" ? -1 : 1;
                    let hours = parseInt(timezone.substr(1, 2), 10);
                    let minutes = parseInt(timezone.substr(4, 2), 10);

                    attributes.utcOffset = sign * ((hours * 60 * 60) + (minutes * 60));
                    attributes.offsetDescription = ref.name;
                }
            }

            console.log(index + "/" + cameraList.length + ": Importing camera " + name + " abspath=" + abspath);

            await api.camera.mkcamera(session, name, attributes);
            await api.vfs.setproperties(session, abspath, {
                birthtime: moment(obj.added.timestamp * 1000).toDate(),
                birthuid: idTransUsersUid[obj.added._by]
            });

            if (obj._owners) {
                for (let owner of obj._owners) {
                    await api.vfs.symlink(session, idTransNodes[owner], abspath + "/owners");
                }
            }

            if (obj.comments && obj.comments.length > 0) {
                await api.vfs.ensure(session, abspath + "/comments", "d");

                for (let comment of obj.comments) {
                    let name2 = moment(comment.added.timestamp * 1000).format();

                    await api.vfs.create(session, abspath + "/comments/" + name2, "c", {
                        text: comment.text
                    });
                    await api.vfs.setproperties(session, abspath + "/comments/" + name2, {
                        birthtime: moment(comment.added.timestamp * 1000).toDate(),
                        birthuid: idTransUsersUid[comment.added._by]
                    });
                }
            }


            idTransNodes[obj._id] = "/cameras/" + name;
            result.cameras++;
        }



        // Import albums
        let albumList = await db.find("nodes", { type: "album" });
        /*
        {
        *    "_id" : "<id>",
        *    "name" : "<name>",
        *    "oldNodeId" : <id>,
        *    "type" : "album",
        *    "added" : {
        *            "timestamp" : 1222201889,
        *            "_by" : "<id>"
        *    },
        *    "modified" : { <- Ignore, import is modified
        *            "timestamp" : 1376087995,
        *            "_by" : "<id>"
        *    },
        *    "comments" : [ ],
            "_admins" : [
                    "<id>"
            ],
            "_readers" : [
                    "<id>",
                    "<id>"
            ],
            "public" : false,
        *    "tags" : [
        *            "<tag>",
        *            "<tag>"
        *    ],
        *    "removed" : false,
        *    "_profilePicture" : "<id>",
        *    "description" : ""
        }
        */

        console.log("Found " + albumList.length + " albums");

        index = 0;
        for (let obj of albumList) {
            index++;

            if (obj.removed) {
                continue;
            }

            obj.name = obj.name.trim();

            let match = obj.name.match(/^[0-9]{0,4}-[0-9]{0,2}-[0-9]{0,2} (.*)/);
            let nameNice = match ? match[1] : obj.name;

            let name = getUniqueName("albums", nameNice);
            let attributes = {
                name: nameNice,
                description: obj.description,
                idV0: obj.oldNodeId,
                idV1: obj._id,
                labels: obj.tags || []
            };

            console.log(index + "/" + albumList.length + ": Importing album " + name);

            let acl = [];

            for (let readerId of obj._readers) {
                let gid = idTransGroupsGid[readerId];
                let push = false;
                let ac = acl.filter((item) => item.gid === gid)[0];

                if (!ac) {
                    ac = { gid: gid, mode: 0 };
                    push = true;
                }

                ac.mode |= api.vfs.MASK_ACL_READ;
                ac.mode |= api.vfs.MASK_ACL_EXEC;

                if (push) {
                    acl.push(ac);
                }
            }

            for (let adminId of obj._admins) {
                let gid = idTransGroupsGid[adminId];
                let push = false;
                let ac = acl.filter((item) => item.gid === gid)[0];

                if (!ac) {
                    ac = { gid: gid, mode: 0 };
                    push = true;
                }

                ac.mode |= api.vfs.MASK_ACL_READ;
                ac.mode |= api.vfs.MASK_ACL_WRITE;
                ac.mode |= api.vfs.MASK_ACL_EXEC;

                if (push) {
                    acl.push(ac);
                }
            }

            await api.album.mkalbum(session, name, attributes);
            await api.vfs.setproperties(session, "/albums/" + name, {
                birthtime: moment(obj.added.timestamp * 1000).toDate(),
                birthuid: idTransUsersUid[obj.added._by],
                acl: acl
            });

            if (obj.comments && obj.comments.length > 0) {
                await api.vfs.ensure(session, "/albums/" + name + "/comments", "d");

                for (let comment of obj.comments) {
                    let name2 = moment(comment.added.timestamp * 1000).format();

                    await api.vfs.create(session, "/albums/" + name + "/comments/" + name2, "c", {
                        text: comment.text
                    });
                    await api.vfs.setproperties(session, "/albums/" + name + "/comments/" + name2, {
                        birthtime: moment(comment.added.timestamp * 1000).toDate(),
                        birthuid: idTransUsersUid[comment.added._by]
                    });
                }
            }

            idTransNodes[obj._id] = "/albums/" + name;
            result.albums++;
        }


        let textList = await db.find("items", { what: "text" });
        /*
        {
        *    "_id" : "<id>",
        *    "oldNodeId" : <id>,
        *    "name" : "<name>",
        *    "what" : "text",
        *    "added" : {
        *        "timestamp" : 1222676688,
        *        "_by" : "<id>"
        *    },
        *    "modified" : { <- Ignore, import is modified
        *        "timestamp" : 1222676688,
        *        "_by" : "<id>"
        *    },
        *    "comments" : [ ],
        *    "removed" : false,
        *    "type" : "birth",
        *    "text" : "",
        *    "where" : {
        *        "latitude" : false,
        *        "longitude" : false,
        *        "source" : false
        *    },
        *    "_with" : false, <- Ignore, not relevant for events
        *    "showing" : [
        *        {
        *            "_id" : "<id>"
        *        }
        *    ],
        *    "_parents" : [ <- Ignore, same as showing
        *        "<id>"
        *    ],
        *    "_who" : false, <- Ignore, not relevant for events
        *    "when" : {
        *        "timestamp" : 387842400,
        *        "source" : {
        *            "datestring" : "1982-04-17 XX:XX:XX",
        *            "type" : "manual",
        *            "timezone" : "(GMT+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna",
        *            "daylightSavings" : true
        *        }
        *    }
        }
        {
            "_id" : "<id>",
            "oldNodeId" : <id>,
            "name" : "<name>",
            "what" : "text",
            "added" : {
                    "timestamp" : 1232410404,
                    "_by" : "<id>"
            },
            "modified" : {
                    "timestamp" : 1362928071,
                    "_by" : "<id>"
            },
            "comments" : [ ],
            "removed" : false,
            "text" : "Hello World.",
            "where" : {
                    "latitude" : false,
                    "longitude" : false,
                    "source" : false
            },
            "_with" : false,
            "showing" : [ ],
            "_parents" : [
                    "<id>"
            ],
            "_who" : "50fbb6993ac1a154730006ac",
            "when" : {
                    "timestamp" : <id>,
                    "source" : {
                            "datestring" : "2006-07-17 XX:XX:XX",
                            "type" : "manual",
                            "timezone" : "(GMT+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna",
                            "daylightSavings" : true
                    }
            }
        }
        */

        console.log("Found " + textList.length + " texts");

        index = 0;
        for (let obj of textList) {
            index++;

            if (obj.removed) {
                continue;
            }

            console.log(index + "/" + textList.length + ": About to import text " + obj.name + " (id=" + obj._id + ") parentId " + obj._parents[0] + " => path " + idTransNodes[obj._parents[0]] + ", parent count:" + obj._parents.length);

            if (!idTransNodes[obj._parents[0]]) {
                console.log("Parent do not exist, skipping");
                continue;
            }

            let dir = path.join(idTransNodes[obj._parents[0]], "texts");

            obj.name = obj.name.trim();

            let name = getUniqueName(dir, obj.name);
            let attributes = {
                name: obj.name,
                description: obj.description,
                idV0: obj.oldNodeId,
                idV1: obj._id,
                labels: obj.tags || [],
                type: obj.type ? obj.type : "generic",
                text: obj.text
            };

            await api.vfs.ensure(session, dir, "d");

            console.log(index + "/" + textList.length + ": Resulting name " + name);

            let abspath = path.join(dir, name);

            console.log(index + "/" + textList.length + ": Importing text " + abspath);

            await api.text.mktext(session, abspath, attributes);
            await api.vfs.setproperties(session, abspath, {
                birthtime: moment(obj.added.timestamp * 1000).toDate(),
                birthuid: idTransUsersUid[obj.added._by]
            });

            if (obj.comments && obj.comments.length > 0) {
                await api.vfs.ensure(session, path.join(abspath, "comments"), "d");

                for (let comment of obj.comments) {
                    let name2 = moment(comment.added.timestamp * 1000).format();

                    await api.vfs.create(session, path.join(abspath, "comments", name2), "c", {
                        text: comment.text
                    });
                    await api.vfs.setproperties(session, path.join(abspath, "comments", name2), {
                        birthtime: moment(comment.added.timestamp * 1000).toDate(),
                        birthuid: idTransUsersUid[comment.added._by]
                    });
                }
            }

            if (obj._who) {
                await api.vfs.symlink(session, idTransNodes[obj._who], path.join(abspath, "createdBy"));
            }

//             for (let showing of obj.showing) {
//                 let link = await api.vfs.symlink(session, idTransNodes[showing._id], path.join(abspath, "tags"));
//
//                 console.log("Created tag to " + idTransNodes[showing._id] + " in " + path.join(abspath, "tags"));
//
//                 await api.vfs.setattributes(session, link, {
//                     type: "tag"
//                 });
//             }

            let item = await api.vfs.resolve(session, abspath);

            item.attributes.when = item.attributes.when || {};

            if (obj.when) {
                if (obj.when.source.type === "manual") {
                    let parts = obj.when.source.datestring.split(" ");
                    let date = parts[0].split("-");
                    let time = parts[1].split(":");

                    if (date[0] !== "XXXX") {
                        item.attributes.when.manual = {};

                        item.attributes.when.manual.year = date[0];

                        if (typeof item.attributes.when.manual.year !== "undefined" && date[1] !== "XX") {
                            item.attributes.when.manual.month = date[1];
                        }

                        if (typeof item.attributes.when.manual.month !== "undefined" && date[2] !== "XX") {
                            item.attributes.when.manual.day = date[2];
                        }

                        if (typeof item.attributes.when.manual.day !== "undefined" && time[0] !== "XX") {
                            item.attributes.when.manual.hour = time[0];
                        }

                        if (typeof item.attributes.when.manual.hour !== "undefined" && time[1] !== "XX") {
                            item.attributes.when.manual.minute = time[1];
                        }

                        if (typeof item.attributes.when.manual.minute !== "undefined" && time[2] !== "XX") {
                            item.attributes.when.manual.second = time[2];
                        }

                        if (typeof item.attributes.when.manual.hour !== "undefined" && obj.when.source.timezone && obj.when.source.timezone !== "Unknown") {
                            item.attributes.when.manual.timezone = obj.when.source.timezone.match(/\(GMT(.*?)\).*/)[1] || "+00:00";
                        }

                        item.attributes.when.manual.comment = obj.when.source.comment;

                        // { "datestring" : "1984-04-20 XX:XX:XX", "type" : "manual", "timezone" : "(GMT+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna", "daylightSavings" : true }
                        // { "type" : "manual", "datestring" : "1956-XX-XX XX:XX:XX", "daylightSavings" : false, "timezone" : "Unknown", "comment" : "" }
                        // { "datestring" : "1984-09-26 XX:XX:XX", "timezone" : "(GMT+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna", "daylightSavings" : true, "type" : "manual", "comment" : "" }
                    }
                }
            }


            item.attributes.where = item.attributes.where || {};

            /*{
                "latitude" : 37.660025,
                "longitude" : 7.879831,
                "source" : "manual"
            }*/

            if (obj.where) {
                if (obj.where.source === "manual") {
                    item.attributes.where.manual = {
                        longitude: item.attributes.where.longitude,
                        latitude: item.attributes.where.latitude
                    };
                }
            }


            await api.vfs.setattributes(session, abspath, item.attributes);

            await api.text.regenerate(session, abspath);

            if (obj.where) {
                if (obj.where.source === "manual") {
                   // Done in first pass above
                } else if (typeof obj.where._id === "string") {
                    await api.vfs.symlink(session, idTransNodes[obj.where._id], path.join(abspath, "location"));
                }
            }

            for (var n = 1; n < obj._parents.length; n++) {
                let dir = path.join(idTransNodes[obj._parents[n]], "texts");
                let name = getUniqueName(dir, obj.name);

                await api.vfs.link(session, abspath, path.join(dir, name));
            }

            idTransItems[obj._id] = abspath;
            result.texts++;
        }


        let weightList = await db.find("items", { what: "measurment" });
        /*
        {
        *    "_id" : "<id>",
        *    "name" : "weight",
        *    "type" : "weight",
        *    "what" : "measurment",
            "when" : {
                    "timestamp" : 1334016000,
                    "source" : {
                            "datestring" : "2012-04-10 XX:XX:XX",
                            "type" : "manual",
                            "comment" : ""
                    }
            },
        *    "value" : 43.4,
        *    "unit" : "kg",
        *    "_parents" : [
        *            "<id>"
        *    ],
        *    "added" : { <- Ignore
        *            "timestamp" : 1371925015,
        *            "_by" : "<id>"
        *    },
        *    "modified" : { <- Ignore
        *            "timestamp" : 1371925015,
        *            "_by" : "<id>"
        *    },
        *    "_who" : false, <- Ignore
        *    "_with" : false, <- Ignore
        *    "where" : { <- Ignore
        *    },
        *    "showing" : [ ], <- Ignore
        *    "comments" : [ ], <- Ignore
        *    "removed" : false
        }
        */

        console.log("Found " + weightList.length + " weight measurments");

        for (let obj of weightList) {
            if (obj.removed) {
                continue;
            }

            for (let id of obj._parents) {
                await api.people.addMeasurement(session, idTransNodes[id], obj.name, obj.when.source.datestring.split(" ")[0], obj.value, obj.unit);
            }

            result.measurments++;
        }


        // Import files
        let fileList = await db.find("items", { what: "file" }/*, { sort: { "_parents.0": 1 } }*/);

        /*
        {
        *    "_id" : "<id>",
        *    "oldNodeId" : <id>,
        *    "oldFileId" : <id>,
        *    "name" : "<filename>",
        *    "what" : "file",
        *    "added" : {
        *            "timestamp" : 1222113357,
        *            "_by" : "<id>"
        *    },
        *    "modified" : { <- Ignore, import is modified
        *            "timestamp" : 1222113357,
        *            "_by" : "<id>"
        *    },
        *    "comments" : [ ],
        *    "removed" : false,
        *    "description" : "",
        *    "where" : {
        *            "latitude" : false,
        *            "longitude" : false,
        *            "source" : false
        *    },
        *    "_with" : false,
        *    "showing" : [
        *            {
        *                    "_id" : "<id>",
        *                    "x" : 0.394166666667,
        *                    "y" : 0.241192411924,
        *                    "width" : 0.095,
        *                    "height" : 0.157181571816
        *            }
        *    ],
        *    "_parents" : [
        *            "<id>"
        *    ],
        *    "_who" : "<id>",
        *    "angle" : 0,
        *    "mirror" : false,
        *    "checksum" : "<hash>",
        *    "when" : {
        *            "source" : false,
        *            "timestamp" : false
        *    },
            "exif" : {

            }
        }
        */


        console.log("Found " + fileList.length + " files");

        index = 0;
        for (let obj of fileList) {
            index++;

            if (obj.removed) {
                continue;
            }

            if (obj._parents.length !== 1) {
                throw new Error("obj._parents !== 1 for " + JSON.stringify(obj));
            }

            console.log(index + "/" + fileList.length + ": About to import " + obj.name + " (id=" + obj._id + ") parentId " + obj._parents[0] + " => path " + idTransNodes[obj._parents[0]]);

            if (!idTransNodes[obj._parents[0]]) {
                console.log("Parent do not exist, skipping");
                continue;
            }

            let dir = path.join(idTransNodes[obj._parents[0]], "files");

            obj.name = obj.name.trim();

            let name = getUniqueName(dir, obj.name);
            let attributes = {
                name: obj.name,
                description: obj.description,
                idV0: obj.oldNodeId,
                idV0File: obj.oldFileId,
                idV1: obj._id,
                labels: obj.tags || [],
                angle: obj.angle,
                mirror: obj.mirror,
                timeindex: obj.thumbPosition,
                md5: obj.checksum
            };


            await api.vfs.ensure(session, dir, "d");

            console.log(index + "/" + fileList.length + ": Resulting name " + name);

            let abspath = path.join(dir, name);

            console.log(index + "/" + fileList.length + ": Importing file " + abspath);

            attributes._source = {
                mode: copyMode,
                filename: path.join(filepath, obj._id)
            };

            try {
                await api.file.mkfile(session, abspath, attributes);
            } catch (error) {
                result.missingFiles.push({
                    error: error.stack.toString(),
                    filename: attributes._source.filename,
                    abspath,
                    obj
                });
                console.log(attributes._source.filename + "was missing...");
                continue;
            }

            await api.vfs.setproperties(session, abspath, {
                birthtime: moment(obj.added.timestamp * 1000).toDate(),
                birthuid: idTransUsersUid[obj.added._by]
            });

            if (obj.comments && obj.comments.length > 0) {
                await api.vfs.ensure(session, path.join(abspath, "comments"), "d");

                for (let comment of obj.comments) {
                    let name2 = moment(comment.added.timestamp * 1000).format();

                    await api.vfs.create(session, path.join(abspath, "comments", name2), "c", {
                        text: comment.text
                    });
                    await api.vfs.setproperties(session, path.join(abspath, "comments", name2), {
                        birthtime: moment(comment.added.timestamp * 1000).toDate(),
                        birthuid: idTransUsersUid[comment.added._by]
                    });
                }
            }

            if (obj._who) {
                await api.vfs.symlink(session, idTransNodes[obj._who], path.join(abspath, "createdBy"));
            }

            if (obj._with && !(await api.vfs.resolve(session, path.join(abspath, "createdWith"), { noerror: true }))) {
                await api.vfs.symlink(session, idTransNodes[obj._with], path.join(abspath, "createdWith"));
            }

            for (let showing of obj.showing) {
                if (idTransNodes[showing._id]) {
                    console.log("Creating tag to " + idTransNodes[showing._id] + " in " + path.join(abspath, "tags", path.basename(idTransNodes[showing._id])));

                    let link = await api.vfs.symlink(session, idTransNodes[showing._id], path.join(abspath, "tags", path.basename(idTransNodes[showing._id])));

                    await api.vfs.setattributes(session, link, {
                        type: "tag",
                        width: showing.width,
                        height: showing.height,
                        x: showing.x,
                        y: showing.y
                    });
                } else {
                    console.log("Could not create tag to with id " + showing._id + ". No such node exist");
                }
            }

            let item = await api.vfs.resolve(session, abspath);

            item.attributes.when = item.attributes.when || {};

            if (obj.when) {
                if (obj.when.source.type === "camera") {
                    // This should be picked up from the file
                } else if (obj.when.source.type === "gps") {
                    // This should be picked up from the file
                } else if (obj.when.source.type === "manual") {
                    let parts = obj.when.source.datestring.split(" ");
                    let date = parts[0].split("-");
                    let time = parts[1].split(":");

                    if (date[0] !== "XXXX") {
                        item.attributes.when.manual = {};

                        item.attributes.when.manual.year = date[0];

                        if (typeof item.attributes.when.manual.year !== "undefined" && date[1] !== "XX") {
                            item.attributes.when.manual.month = date[1];
                        }

                        if (typeof item.attributes.when.manual.month !== "undefined" && date[2] !== "XX") {
                            item.attributes.when.manual.day = date[2];
                        }

                        if (typeof item.attributes.when.manual.day !== "undefined" && time[0] !== "XX") {
                            item.attributes.when.manual.hour = time[0];
                        }

                        if (typeof item.attributes.when.manual.hour !== "undefined" && time[1] !== "XX") {
                            item.attributes.when.manual.minute = time[1];
                        }

                        if (typeof item.attributes.when.manual.minute !== "undefined" && time[2] !== "XX") {
                            item.attributes.when.manual.second = time[2];
                        }

                        if (typeof item.attributes.when.manual.hour !== "undefined" && obj.when.source.timezone && obj.when.source.timezone !== "Unknown") {
                            item.attributes.when.manual.timezone = obj.when.source.timezone.match(/\(GMT(.*?)\).*/)[1] || "+00:00";
                        }

                        item.attributes.when.manual.comment = obj.when.source.comment;

                        // { "datestring" : "1984-04-20 XX:XX:XX", "type" : "manual", "timezone" : "(GMT+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna", "daylightSavings" : true }
                        // { "type" : "manual", "datestring" : "1956-XX-XX XX:XX:XX", "daylightSavings" : false, "timezone" : "Unknown", "comment" : "" }
                        // { "datestring" : "1984-09-26 XX:XX:XX", "timezone" : "(GMT+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna", "daylightSavings" : true, "type" : "manual", "comment" : "" }
                    }
                }
            }


            item.attributes.where = item.attributes.where || {};

            /*{
                "latitude" : 24.656725,
                "longitude" : 2.6831,
                "source" : "manual"
            }*/

            if (obj.where) {
                if (obj.where.source === "gps") {
                    // This should be picked up from the file
                } else if (obj.where.source === "manual") {
                    item.attributes.where.manual = {
                        longitude: item.attributes.where.longitude,
                        latitude: item.attributes.where.latitude
                    };
                }
            }


            await api.vfs.setattributes(session, abspath, item.attributes);

            await api.file.regenerate(session, abspath);

            if (obj.where) {
                if (obj.where.source === "gps") {
                    // This should be picked up from the file
                } else if (obj.where.source === "manual") {
                    // Done in pass above
                } else if (typeof obj.where._id === "string") {
                    await api.vfs.symlink(session, idTransNodes[obj.where._id], path.join(abspath, "location"));
                }
            }


            /* "versions" : [
                {
                        "id" : "<id>",
                        "name" : "IMG_0001.CR2",
                        "size" : 8657282
                }
                ]*/

            if (obj.versions && obj.versions.length > 0) {
                let versionsdir = path.join(abspath, "versions");

                await api.vfs.ensure(session, versionsdir, "d");

                for (let version of obj.versions) {
                    let attributes = {
                        name: version.name,
                        description: "",
                        idV1: version.id,
                        labels: []
                    };

                    const uniqueName = await api.node.getUniqueName(session, versionsdir, version.name);
                    let versionabspath = path.join(versionsdir, uniqueName);

                    attributes._source = {
                        mode: copyMode,
                        filename: path.join(filepath, version.id)
                    };

                    await api.file.mkfile(session, versionabspath, attributes);
                    await api.vfs.setproperties(session, versionabspath, {
                        birthtime: moment(obj.added.timestamp * 1000).toDate(),
                        birthuid: idTransUsersUid[obj.added._by]
                    });
                }
            }


            idTransItems[obj._id] = abspath;
            result.files++;
        }


        // Second pass
        console.log("Second pass!");

        console.log("Linking people to users!");
        // Process users
        for (let obj of userList) {
            if (obj.username === "admin") {
                continue;
            }

//             console.log("Users...");

            if (obj._person) {
                await api.vfs.symlink(session, idTransNodes[obj._person], "/users/" + idTransUsers[obj._id] + "/person");
            }
        }

        // Process people
        console.log("Processing people!");
        for (let obj of peopleList) {
            // TODO: public

//             console.log("People...");

            if (obj.family._partner) {
                await api.vfs.symlink(session, idTransNodes[obj.family._partner], idTransNodes[obj._id] + "/partner");
            }

            if (obj._profilePicture) {
                await api.vfs.unlink(session, idTransNodes[obj._id] + "/profilePicture");
                try {
                    await api.vfs.symlink(session, idTransItems[obj._profilePicture], idTransNodes[obj._id] + "/profilePicture");
                } catch (error) {
                    console.error(error);
                }
            }

            for (let parent of obj.family.parents) {
                try {
//                 let gender = peopleList.filter((person) => person._id === parent._id)[0].gender;
//                 let name = "parent";
//
//                 if (gender === "f") {
//                     name = "mother";
//                 } else if (gender === "m") {
//                     name = "father";
//                 }

                 await api.vfs.symlink(session, idTransNodes[parent._id], idTransNodes[obj._id] + "/parents");

//                 name = "child";
//
//                 if (obj.gender === "f") {
//                     name = "daughter";
//                 } else if (obj.gender === "m") {
//                     name = "son";
//                 }

                    await api.vfs.symlink(session, idTransNodes[obj._id], idTransNodes[parent._id] + "/children");
                } catch (error) {
                    console.error(error);
                    console.error("Failed to connect parents or children", parent._id, "or", obj._id, "does not exist in idTransNodes");
                }
            }

            for (let locationId of obj._homes) {
                await api.vfs.symlink(session, idTransNodes[locationId], idTransNodes[obj._id] + "/homes");
                await api.vfs.symlink(session, idTransNodes[obj._id], idTransNodes[locationId] + "/residents");
            }

            await api.vfs.chown(session, idTransNodes[obj._id], idTransUsers[obj.added._by], "users", { recursive: true });
        }


        // Process locations
        console.log("Processing locations!");
        for (let obj of locationList) {
            if (obj._profilePicture) {
                if (!idTransItems[obj._profilePicture]) {
                    console.error("Could not find imported item which is specified as profilePicture");
                    console.error(obj._id, obj._profilePicture, idTransNodes[obj._id]);
                } else {
                    await api.vfs.unlink(session, idTransNodes[obj._id] + "/profilePicture");
                    await api.vfs.symlink(session, idTransItems[obj._profilePicture], idTransNodes[obj._id] + "/profilePicture");
                }
            }

            await api.vfs.chown(session, idTransNodes[obj._id], idTransUsers[obj.added._by], "users", { recursive: true });
        }

        console.log("Processing cameras!");
        for (let obj of cameraList) {
            if (obj._profilePicture) {
                if (!idTransItems[obj._profilePicture]) {
                    console.error("Could not find imported item which is specified as profilePicture");
                    console.error(obj._id, obj._profilePicture, idTransNodes[obj._id]);
                } else {
                    await api.vfs.unlink(session, idTransNodes[obj._id] + "/profilePicture");
                    await api.vfs.symlink(session, idTransItems[obj._profilePicture], idTransNodes[obj._id] + "/profilePicture");
                }
            }

            await api.vfs.chown(session, idTransNodes[obj._id], idTransUsers[obj.added._by], "users", { recursive: true });
        }

        // Process album
        console.log("Processing albums!");
        for (let obj of albumList) {
            if (obj._profilePicture) {
                if (!idTransItems[obj._profilePicture]) {
                    console.error("Could not find imported item which is specified as profilePicture");
                    console.error(obj._id, obj._profilePicture, idTransNodes[obj._id]);
                } else {
                    await api.vfs.unlink(session, idTransNodes[obj._id] + "/profilePicture");
                    await api.vfs.symlink(session, idTransItems[obj._profilePicture], idTransNodes[obj._id] + "/profilePicture");
                }
            }

            await api.vfs.chown(session, idTransNodes[obj._id], idTransUsers[obj.added._by], "users", { recursive: true });
        }

        // This is already done by album and such above
//         for (let obj of textList) {
//             await api.vfs.chown(session, idTransNodes[obj._id], idTransUsers[obj.added._by], "users", { recursive: true });
//         }
//
//         for (let obj of fileList) {
//             await api.vfs.chown(session, idTransNodes[obj._id], idTransUsers[obj.added._by], "users", { recursive: true });
//         }


        console.log("Import all done", JSON.stringify(result));

        await db.stop();

        session.umask = umask; // Restore session umask

        return result;
    })
});

module.exports = update;
