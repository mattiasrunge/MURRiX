"use strict";

const co = require("bluebird").coroutine;
const db = require("./db");
const log = require("./log")(module);

let timer = null;
let params = {};
let updatedSessions = new Set();

function createSession(data) {
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

        yield module.exports.loadSessions();

        timer = setInterval(() => {
            module.exports.persistSessions();
        }, 1000 * 60 * 5);
    }),
    getSessions: () => {
        return sessions;
    },
    loadSessions: co(function*() {
        let list = yield db.find("sessions");

        log.info("Loading " + list.length + " sessions");

        for (let session of list) {
            sessions[session._id] = session;
        }
    }),
    persistSessions: co(function*() {
        let list = Array.from(updatedSessions);

        updatedSessions.clear();

        log.info("Saving " + list.length + " sessions");

        for (let session of list) {
            yield db.updateOne("sessions", session, { upsert: true });
        }
    }),
    stop: co(function*() {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }

        yield module.exports.persistSessions();
    })
};
