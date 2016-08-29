"use strict";

const path = require("path");
const co = require("bluebird").coroutine;
const moment = require("moment");
const api = require("api.io");
const bus = require("../../core/lib/bus");

let params = {};
let isCleaning = false;

let feed = api.register("feed", {
    deps: [ "vfs", "auth" ],
    limit: 20,
    init: co(function*(config) {
        params = config;

        bus.on("comment.new", feed.onNewComment);
        bus.on("album.new", feed.onNewAlbum);
        bus.on("location.new", feed.onNewLocation);
        bus.on("people.new", feed.onNewPerson);

        if (!(yield api.vfs.resolve(api.auth.getAdminSession(), "/news", { noerror: true }))) {
            yield api.vfs.create(api.auth.getAdminSession(), "/news", "d");
            yield api.vfs.chown(api.auth.getAdminSession(), "/news", "admin", "users");
            yield api.vfs.chmod(api.auth.getAdminSession(), "/news", 0o770);
        }
    }),
    mknews: co(function*(attributes) {
        let baseName = moment().valueOf().toString();
        let name = baseName;

        let counter = 1;
        while (yield api.vfs.resolve(api.auth.getAdminSession(), path.join("/news", name), { noerror: true })) {
            name = baseName + "_" + counter;
            counter++;

            if (counter > 1000) {
                throw new Error("Could not allocate a good name");
            }
        }

        let abspath = path.join("/news", name);

        let news = yield api.vfs.create(api.auth.getAdminSession(), abspath, "n", attributes);

        feed.emit("new", { node: news, path: abspath });

        yield feed.cleanup();
    }),
    cleanup: co(function*() {
        if (isCleaning) {
            return;
        }

        isCleaning = true;

        try {
            let parent = yield api.vfs.resolve(api.auth.getAdminSession(), "/news");

            parent.properties.children.sort((a, b) => {
                return b.name.localeCompare(a.name);
            });

            let children = parent.properties.children.slice(feed.limit);

            for (let child of children) {
                yield api.vfs.unlink(api.auth.getAdminSession(), path.join("/news", child.name));
            }

            isCleaning = false;
        } catch (e) {
            isCleaning = false;
            throw e;
        }
    }),
    getLatest: co(function*() {
        let list = yield feed.list(api.auth.getAdminSession(), { limit: 1 });
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
        let node = yield api.vfs.resolve(api.auth.getAdminSession(), data.path);

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

        return yield api.vfs.list(session, "/news", options);
    },
    eventThisDay: function*(session, datestr) {
        let start = moment.utc(datestr);
        let end = start.clone().add(1, "day");
        let result = [];
        let cache = {};

        // TODO: this does not scale very well, can we select more directly in mongodb?
        let events = yield api.vfs.query(session, {
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
                let paths = yield api.vfs.lookup(session, event._id, cache);
                for (let p of paths) {
                    p = path.resolve(path.join(p, "..", ".."));

                    people.push({
                        path: p,
                        node: yield api.vfs.resolve(session, p)
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

                    let death = (yield api.vfs.list(session, people[0].path + "/texts", { filter: {
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
