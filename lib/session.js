"use strict";

const db = require("./db");
const log = require("./log")(module);
const { bus } = require("../vfs");

let timer = null;
const updatedSessions = new Set();

function createSession(data) {
    data._created = new Date();

    const session = new Proxy(data, {
        set: (target, name, value) => {
            if (target[name] !== value) {
                target[name] = value;

                updatedSessions.add(session);
            }

            return true;
        }
    });

    return session;
}

const sessions = new Proxy({}, {
    get: (target, id) => {
        if (!(id in target)) {
            target[id] = createSession({ _id: id });
            log.info(`Creating new session ${id}`);
        }

        return target[id];
    },
    set: (target, id, data) => {
        target[id] = createSession({ ...data, _id: id });

        return true;
    }
});

module.exports = {
    init: async () => {
        await module.exports.load();

        timer = setInterval(() => module.exports.store(), 100);
    },
    getSessions: () => {
        return sessions;
    },
    load: async () => {
        const list = await db.find("sessions");

        for (const session of list) {
            sessions[session._id] = session;
        }

        log.info(`Loaded ${list.length} sessions`);

        await module.exports.store();
    },
    store: async () => {
        if (updatedSessions.size === 0) {
            return;
        }

        const saveList = Array.from(updatedSessions);
        updatedSessions.clear();

        const now = Date.now();
        const expiredList = [];

        for (const sessionId of Object.keys(sessions)) {
            if (sessions[sessionId]._expires < now) {
                bus.emit("session.expired", { session: sessions[sessionId] });
                expiredList.push(sessionId);
                delete sessions[sessionId];
            }
        }

        for (const session of saveList) {
            bus.emit("session.updated", { session });

            await db.updateOne("sessions", session, { upsert: true });
        }

        for (const sessionId of expiredList) {
            await db.removeOne("sessions", sessionId);
        }

        if (expiredList.length > 0) {
            log.info(`Removed ${expiredList.length} expired sessions`);
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
