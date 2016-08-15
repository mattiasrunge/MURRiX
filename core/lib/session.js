"use strict";

const co = require("bluebird").coroutine;
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
    init: co(function*(config) {
        params = config;

        yield module.exports.load();

        timer = setInterval(() => {
            module.exports.store();
        }, 1000 * 60 * 5);
    }),
    getSessions: () => {
        return sessions;
    },
    load: co(function*() {
        let list = yield db.find("sessions");

        for (let session of list) {
            sessions[session._id] = session;
        }

        log.info("Loaded " + list.length + " sessions");

        yield module.exports.store();
    }),
    store: co(function*() {
        let saveList = Array.from(updatedSessions);
        updatedSessions.clear();

        let now = new Date().getTime();
        let expiredList = [];

        for (let sessionId of Object.keys(sessions)) {
            if (sessions[sessionId]._expires < now) {
                expiredList.push(sessionId);
                delete sessions[sessionId];
            }
        }

        for (let session of saveList) {
            yield db.updateOne("sessions", session, { upsert: true });
        }

        for (let sessionId of expiredList) {
            yield db.removeOne("sessions", sessionId);
        }

        if (expiredList.length > 0) {
            log.info("Removed " + expiredList.length + " expired sessions");
        }
    }),
    stop: co(function*() {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }

        yield module.exports.store();
    })
};
