"use strict";

const moment = require("moment");
const api = require("api.io");

let params = {};

const message = api.register("message", {
    deps: [ "vfs", "auth" ],
    init: async (config) => {
        params = config;
    },
    send: api.export(async (session, username, text, metadata) => {
        let user = await api.vfs.resolve(api.auth.getAdminSession(), "/users/" + username);

        if (!user) {
            throw new Error("No such user");
        }

        let name = moment().format();
        await api.vfs.ensure(api.auth.getAdminSession(), "/users/" + username + "/all_messages", "d");
        await api.vfs.ensure(api.auth.getAdminSession(), "/users/" + username + "/new_messages", "d");

        let item = await api.vfs.create(api.auth.getAdminSession(), "/users/" + username + "/all_messages/" + name, "m", {
            from: await api.auth.uid(session, session.username),
            text: text,
            metadata: metadata || {}
        });

        await api.vfs.link(api.auth.getAdminSession(), "/users/" + username + "/all_messages/" + name, "/users/" + username + "/new_messages");

        message.emit("new", item, { username: username });
    }),
    count: api.export(async (session) => {
        let allMessages = [];
        let newMessages = [];

        try {
            allMessages = await api.vfs.list(api.auth.getAdminSession(), "/users/" + session.username + "/all_messages");
        } catch (e) {}

        try {
            newMessages = await api.vfs.list(api.auth.getAdminSession(), "/users/" + session.username + "/new_messages");
        } catch (e) {}

        allMessages = allMessages || [];
        newMessages = newMessages || [];

        return {
            total: allMessages.length,
            unread: newMessages.length
        };
    }),
    read: api.export(async (session, index) => {
        let messages = [];

        if (typeof index === "undefined") {
            try {
                messages = await api.vfs.list(api.auth.getAdminSession(), "/users/" + session.username + "/new_messages");
            } catch (e) {}

            index = Math.max(messages.length - 1, 0);
        } else {
            try {
                messages = await api.vfs.list(api.auth.getAdminSession(), "/users/" + session.username + "/all_messages");
            } catch (e) {}
        }

        if (messages.length <= index) {
            throw new Error("No message with that index");
        }

        api.vfs.unlink(api.auth.getAdminSession(), "/users/" + session.username + "/new_messages/" + messages[index].name);

        return messages[index];
    }),
    list: api.export(async (session) => {
        let messages = [];
        let unreadIds = [];

        try {
            messages = await api.vfs.list(api.auth.getAdminSession(), "/users/" + session.username + "/all_messages");
        } catch (e) {}

        try {
            let node = await api.vfs.resolve(api.auth.getAdminSession(), "/users/" + session.username + "/new_messages");

            if (node) {
                unreadIds = node.properties.children.map((child) => child.id);
            }
        } catch (e) {}

        messages = messages || [];

        messages.forEach((item, index) => {
            item.index = index;
            item.unread = unreadIds.includes(item.node._id);
        });

        return messages;
    })
});

module.exports = message;
