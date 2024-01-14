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
        let user = await cmd.resolve(api.auth.getAdminSession(), "/users/" + username);

        if (!user) {
            throw new Error("No such user");
        }

        let name = moment().format();
        await cmd.ensure(api.auth.getAdminSession(), "/users/" + username + "/all_messages", "d");
        await cmd.ensure(api.auth.getAdminSession(), "/users/" + username + "/new_messages", "d");

        let item = await cmd.create(api.auth.getAdminSession(), "/users/" + username + "/all_messages/" + name, "m", {
            from: await api.auth.uid(session, session.username),
            text: text,
            metadata: metadata || {}
        });

        await cmd.link(api.auth.getAdminSession(), "/users/" + username + "/all_messages/" + name, "/users/" + username + "/new_messages");

        message.emit("new", item, { username: username });
    }),
    count: api.export(async (session) => {
        let allMessages = [];
        let newMessages = [];

        try {
            allMessages = await cmd.list(api.auth.getAdminSession(), "/users/" + session.username + "/all_messages");
        } catch (e) {}

        try {
            newMessages = await cmd.list(api.auth.getAdminSession(), "/users/" + session.username + "/new_messages");
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
                messages = await cmd.list(api.auth.getAdminSession(), "/users/" + session.username + "/new_messages");
            } catch (e) {}

            index = Math.max(messages.length - 1, 0);
        } else {
            try {
                messages = await cmd.list(api.auth.getAdminSession(), "/users/" + session.username + "/all_messages");
            } catch (e) {}
        }

        if (messages.length <= index) {
            throw new Error("No message with that index");
        }

        cmd.unlink(api.auth.getAdminSession(), "/users/" + session.username + "/new_messages/" + messages[index].name);

        return messages[index];
    }),
    list: api.export(async (session) => {
        let messages = [];
        let unreadIds = [];

        try {
            messages = await cmd.list(api.auth.getAdminSession(), "/users/" + session.username + "/all_messages");
        } catch (e) {}

        try {
            let node = await cmd.resolve(api.auth.getAdminSession(), "/users/" + session.username + "/new_messages");

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
