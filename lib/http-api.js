"use strict";

const auth = require("./auth");
const vfs = require("./vfs");

module.exports = {
    session: function*(session, data) {
        session.username = session.username || "guest";
        session.groups = session.groups || [ "guest" ];
        return session;
    },
    login: function*(session, data) {
        let result = yield auth.authenticate(data.username, data.password);

        // TODO: Get groups from user node

        if (result) {
            session.username = data.username;
            //TODO: session.groups = [ ];
        }

        return result;
    },
    logout: function*(session, data) {
        session.username = "guest";
        session.groups = [ "guest" ];
        return true;
    },
    list: function*(session, data) {
        return vfs.list(session, data.dir);
    },
    create: function*(session, data) {
        return vfs.create(session, data.dir, data.type);
    },
    remove: function*(session, data) {
        return vfs.remove(session, data.dir);
    },
    resolve: function*(session, data) {
        return vfs.resolve(session, data.dir);
    },
    move: function*(session, data) {
        return vfs.move(session, data.from, data.to);
    },
    copy: function*(session, data) {
        return vfs.copy(session, data.from, data.to);
    }
};
