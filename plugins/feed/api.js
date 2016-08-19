"use strict";

const path = require("path");
const co = require("bluebird").coroutine;
const moment = require("moment");
const api = require("api.io");
const plugin = require("../../core/lib/plugin");
const vfs = require("../vfs/api");
const auth = require("../auth/api");

let params = {};
let isCleaning = false;

let feed = api.register("feed", {
    deps: [ "vfs", "auth" ],
    limit: 20,
    init: co(function*(config) {
        params = config;

        plugin.on("comment.new", feed.onNewComment);
        plugin.on("album.new", feed.onNewAlbum);
        plugin.on("location.new", feed.onNewLocation);
        plugin.on("people.new", feed.onNewPerson);

        if (!(yield vfs.resolve(auth.getAdminSession(), "/news", { noerror: true }))) {
            yield vfs.create(auth.getAdminSession(), "/news", "d");
            yield vfs.chown(auth.getAdminSession(), "/news", "admin", "users");
            yield vfs.chmod(auth.getAdminSession(), "/news", 0o770);
        }
    }),
    mknews: co(function*(attributes) {
        let baseName = moment().valueOf().toString();
        let name = baseName;

        let counter = 1;
        while (yield vfs.resolve(auth.getAdminSession(), path.join("/news", name), { noerror: true })) {
            name = baseName + "_" + counter;
            counter++;

            if (counter > 1000) {
                throw new Error("Could not allocate a good name");
            }
        }

        let abspath = path.join("/news", name);

        let news = yield vfs.create(auth.getAdminSession(), abspath, "n", attributes);

        feed.emit("new", { node: news, path: abspath });

        yield feed.cleanup();
    }),
    cleanup: co(function*() {
        if (isCleaning) {
            return;
        }

        isCleaning = true;

        try {
            let parent = yield vfs.resolve(auth.getAdminSession(), "/news");

            parent.properties.children.sort((a, b) => {
                return b.name.localeCompare(a.name);
            });

            let children = parent.properties.children.slice(feed.limit);

            for (let child of children) {
                yield vfs.unlink(auth.getAdminSession(), path.join("/news", child.name));
            }

            isCleaning = false;
        } catch (e) {
            isCleaning = false;
            throw e;
        }
    }),
    getLatest: co(function*() {
        let list = yield feed.list(auth.getAdminSession(), { limit: 1 });
        return list[0];
    }),
    onNewPerson: co(function*(event, data) {
        yield feed.mknews({
            events: [ data._id ],
            type: "p",
            action: "created",
            path: data.path,
            uid: data.uid
        });
    }),
    onNewLocation: co(function*(event, data) {
        yield feed.mknews({
            events: [ data._id ],
            type: "l",
            action: "created",
            path: data.path,
            uid: data.uid
        });
    }),
    onNewAlbum: co(function*(event, data) {
        yield feed.mknews({
            events: [ data._id ],
            type: "a",
            action: "created",
            path: data.path,
            uid: data.uid
        });
    }),
    onNewComment: co(function*(event, data) {
        let latest = yield feed.getLatest();
        let node = yield vfs.resolve(auth.getAdminSession(), data.path);

        if (latest &&
            latest.node.attributes.type === node.properties.type &&
            latest.node.attributes.path === data.path) {
            return;
        }

        yield feed.mknews({
            events: [ data._id ],
            type: node.properties.type,
            action: "comment",
            path: data.path,
            uid: data.uid
        });
    }),
    list: function*(session, options) {
        options = options || {};

        options.reverse = options.reverse || true;
        options.limit = options.limit || feed.limit;

        return yield vfs.list(session, "/news", options);
    },
    eventThisDay: function*(session, datestr) {
        let start = moment.utc(datestr);
        let end = start.clone().add(1, "day");
        let result = [];
        let cache = {};

        // TODO: this does not scale very well, can we select more directly in mongodb?
        let events = yield vfs.query(session, {
            "properties.type": "t",
            "attributes.type": { $in: [ "birth", "marriage", "engagement" ] },
            "attributes.time.timestamp": { $ne: null }
        });

        for (let event of events) {
            let eventDate = moment.unix(event.attributes.time.timestamp).utc();
            let testDate = eventDate.clone().year(start.year());

            if (testDate.isBetween(start, end, "date", "[)")) {
                let data = {
                    node: event
                };

                let people = [];
                let paths = yield vfs.lookup(session, event._id, cache);
                for (let p of paths) {
                    p = path.resolve(path.join(p, "..", ".."));

                    people.push({
                        path: p,
                        node: yield vfs.resolve(session, p)
                    });
                }

                if (event.attributes.type === "marriage") {
                    data.type = "marriage";
                    data.person1 = people[0];
                    data.person2 = people[1];
                    data.years = start.year() - eventDate.year();
                } else if (event.attributes.type === "engagement") {
                    data.type = "engagement";
                    data.person1 = people[0];
                    data.person2 = people[1];
                    data.years = start.year() - eventDate.year();
                } else if (event.attributes.type === "birth") {
                    data.type = "birthday";
                    data.person = people[0];
                    data.ageNow = start.year() - eventDate.year();
                    data.ageAtDeath = false;

                    let death = (yield vfs.list(session, people[0].path + "/texts", { filter: {
                        "attributes.type": "death"
                    } }))[0];

                    if (death) {
                        let deathDate = moment.unix(death.node.attributes.time.timestamp).utc();

                        data.ageAtDeath = deathDate.year() - eventDate.year();
                    }
                }

                result.push(data);
            }
        }

        return result;
    }
});

module.exports = feed;
