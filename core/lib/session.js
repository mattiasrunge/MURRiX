"use strict";

const db = require("./db");
const log = require("./log")(module);

let timer = null;
let params = {};
let updatedSessions = new Set();

function createSession(data) {
    data._created = new Date();

    let session = new Proxy(data, {
        set: (target, name, value) => {
            target[name] = value;

            updatedSessions.add(session);
            return true;
        }
    });

    return session;
}

let sessions = new Proxy({}, {
    get: (target, id) => {
        if (!(id in target)) {
            target[id] = createSession({ _id: id });
            log.info("Creating new session " + id);
        }

        return target[id];
    },
    set: (target, id, data) => {
        data._id = id;
        target[id] = createSession(data);
        return true;
    }
});

module.exports = {
    init: async (config) => {
        params = config;

        await module.exports.load();

        timer = setInterval(() => {
            module.exports.store();
        }, 1000 * 60 * 5);
    },
    getSessions: () => {
        return sessions;
    },
    load: async () => {
        let list = await db.find("sessions");

        for (let session of list) {
            sessions[session._id] = session;
        }

        log.info("Loaded " + list.length + " sessions");

        await module.exports.store();
    },
    store: async () => {
        let saveList = Array.from(updatedSessions);
        updatedSessions.clear();

        let now = Date.now();
        let expiredList = [];

        for (let sessionId of Object.keys(sessions)) {
            if (sessions[sessionId]._expires < now) {
                expiredList.push(sessionId);
                delete sessions[sessionId];
            }
        }

        for (let session of saveList) {
            await db.updateOne("sessions", session, { upsert: true });
        }

        for (let sessionId of expiredList) {
            await db.removeOne("sessions", sessionId);
        }

        if (expiredList.length > 0) {
            log.info("Removed " + expiredList.length + " expired sessions");
        }
    },
    stop: async () => {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }

        await module.exports.store();
    }
};
