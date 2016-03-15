"use strict";

const vfs = require("./vfs");

module.exports = {
    session: function*(session/*, data*/) {
        if (!session.username) {
            yield vfs.login(session, "guest", null, true);
        }

        return session;
    },
    login: function*(session, data) {
        return yield vfs.login(session, data.username, data.password);
    },
    logout: function*(session/*, data*/) {
        return yield vfs.login(session, "guest", null, true);
    },
    id: function*(session, data) {
        return yield vfs.id(session, data.username);
    },
    passwd: function*(session, data) {
        return yield vfs.passwd(session, data.username, data.password);
    },
    messagesend: function*(session, data) {
        return yield vfs.messageSend(session, data.username, data.text, data.metadata);
    },
    messagecount: function*(session, data) {
        return yield vfs.messageCount(session);
    },
    messageread: function*(session, data) {
        return yield vfs.messageRead(session, data.index);
    },
    messagelist: function*(session, data) {
        return yield vfs.messageList(session);
    },
    uname: function*(session, data) {
        return yield vfs.uname(session, data.uid);
    },
    gname: function*(session, data) {
        return yield vfs.gname(session, data.gid);
    },
    uid: function*(session, data) {
        return yield vfs.uid(session, data.uname);
    },
    gid: function*(session, data) {
        return yield vfs.gid(session, data.gname);
    },
    access: function*(session, data) {
        return vfs.access(session, data.abspath, data.modestr);
    },
    resolve: function*(session, data) {
        return vfs.resolve(session, data.abspath);
    },
    find: function*(session, data) {
        return vfs.find(session, data.abspath, data.search);
    },
    list: function*(session, data) {
        return vfs.list(session, data.abspath, data.all);
    },
    chmod: function*(session, data) {
        return vfs.chmod(session, data.abspath, data.mode);
    },
    chown: function*(session, data) {
        return vfs.chown(session, data.abspath, data.username, data.group);
    },
    setattributes: function*(session, data) {
        return vfs.setattributes(session, data.abspath, data.attributes);
    },
    create: function*(session, data) {
        return vfs.create(session, data.abspath, data.type, data.attributes);
    },
    unlink: function*(session, data) {
        return vfs.unlink(session, data.abspath);
    },
    link: function*(session, data) {
        return vfs.link(session, data.srcpath, data.destpath);
    },
    move: function*(session, data) {
        return vfs.move(session, data.srcpath, data.destpath);
    },
    copy: function*(session, data) {
        return vfs.copy(session, data.srcpath, data.destpath);
    },
    allocateuploadid: function*(session/*, data*/) {
        return session.allocateUploadId();
    }
};
