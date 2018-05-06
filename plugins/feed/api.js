"use strict";

const path = require("path");
const moment = require("moment");
const api = require("api.io");
const bus = require("../../lib/bus");

let params = {};
let isCleaning = false;

const feed = api.register("feed", {
    deps: [ "vfs", "auth" ],
    limit: 20,
    init: async (config) => {
        params = config;

        bus.on("comment.new", feed.onNewComment);
        bus.on("album.new", feed.onNewAlbum);
        bus.on("location.new", feed.onNewLocation);
        bus.on("people.new", feed.onNewPerson);

        if (!(await api.vfs.resolve(api.auth.getAdminSession(), "/news", { noerror: true }))) {
            await api.vfs.create(api.auth.getAdminSession(), "/news", "d");
            await api.vfs.chown(api.auth.getAdminSession(), "/news", "admin", "users");
            await api.vfs.chmod(api.auth.getAdminSession(), "/news", 0o770);
        }
    },
    mknews: async (attributes) => {
        let baseName = moment().valueOf().toString();
        let name = baseName;

        let counter = 1;
        while (await api.vfs.resolve(api.auth.getAdminSession(), path.join("/news", name), { noerror: true })) {
            name = baseName + "_" + counter;
            counter++;

            if (counter > 1000) {
                throw new Error("Could not allocate a good name");
            }
        }

        let abspath = path.join("/news", name);

        let news = await api.vfs.create(api.auth.getAdminSession(), abspath, "n", attributes);

        feed.emit("new", { node: news, path: abspath });

        await feed.cleanup();
    },
    cleanup: async () => {
        if (isCleaning) {
            return;
        }

        isCleaning = true;

        try {
            let parent = await api.vfs.resolve(api.auth.getAdminSession(), "/news");

            parent.properties.children.sort((a, b) => {
                return b.name.localeCompare(a.name);
            });

            let children = parent.properties.children.slice(feed.limit);

            for (let child of children) {
                await api.vfs.unlink(api.auth.getAdminSession(), path.join("/news", child.name));
            }

            isCleaning = false;
        } catch (e) {
            isCleaning = false;
            throw e;
        }
    },
    getLatest: async () => {
        let list = await feed.list(api.auth.getAdminSession(), { limit: 1 });
        return list[0];
    },
    onNewPerson: async (event, data) => {
        await feed.mknews({
            events: [ data._id ],
            type: "p",
            action: "created",
            path: data.path,
            uid: data.uid
        });
    },
    onNewLocation: async (event, data) => {
        await feed.mknews({
            events: [ data._id ],
            type: "l",
            action: "created",
            path: data.path,
            uid: data.uid
        });
    },
    onNewAlbum: async (event, data) => {
        await feed.mknews({
            events: [ data._id ],
            type: "a",
            action: "created",
            path: data.path,
            uid: data.uid
        });
    },
    onNewComment: async (event, data) => {
        let latest = await feed.getLatest();
        let node = await api.vfs.resolve(api.auth.getAdminSession(), data.path);

        if (latest &&
            latest.node.attributes.type === node.properties.type &&
            latest.node.attributes.path === data.path) {
            return;
        }

        await feed.mknews({
            events: [ data._id ],
            type: node.properties.type,
            action: "comment",
            path: data.path,
            uid: data.uid
        });
    },
    list: api.export(async (session, options) => {
        options = options || {};

        options.reverse = options.reverse || true;
        options.limit = options.limit || feed.limit;

        const list = await api.vfs.list(session, "/news", options);
        const filtered = [];

        for (const item of list) {
            const readable = await api.vfs.access(session, item.node.attributes.path, "r");

            if (readable) {
                filtered.push(item);
            }
        }

        return filtered;
    }),
    eventThisDay: api.export(async (session, datestr) => {
        let start = moment.utc(datestr);
        let end = start.clone().add(1, "day");
        let result = [];
        let cache = {};

        // TODO: this does not scale very well, can we select more directly in mongodb?
        let events = await api.vfs.query(session, {
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
                let paths = await api.vfs.lookup(session, event._id, cache);
                for (let p of paths) {
                    p = path.resolve(path.join(p, "..", ".."));

                    people.push({
                        path: p,
                        node: await api.vfs.resolve(session, p)
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

                    let death = (await api.vfs.list(session, people[0].path + "/texts", { filter: {
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
    })
});

module.exports = feed;
