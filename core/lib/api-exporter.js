"use strict";

const api = require("api.io");
const { vfs, bus, mode } = require("../../vfs");
const { mapobj } = require("./tools");

// TODO: Most of this is ugly... api.io does not really fit what we want

class APIExporter {
    async init() {
        const apis = [];

        for (const ns of Object.keys(vfs.namespaces)) {
            const obj = mapobj(vfs.namespaces[ns], (item) => api.export(item));

            obj.MASK_OWNER_READ = mode.MASKS.OWNER.READ;
            obj.MASK_OWNER_WRITE = mode.MASKS.OWNER.WRITE;
            obj.MASK_OWNER_EXEC = mode.MASKS.OWNER.EXEC;
            obj.MASK_GROUP_READ = mode.MASKS.GROUP.READ;
            obj.MASK_GROUP_WRITE = mode.MASKS.GROUP.WRITE;
            obj.MASK_GROUP_EXEC = mode.MASKS.GROUP.EXEC;
            obj.MASK_OTHER_READ = mode.MASKS.OTHER.READ;
            obj.MASK_OTHER_WRITE = mode.MASKS.OTHER.WRITE;
            obj.MASK_OTHER_EXEC = mode.MASKS.OTHER.EXEC;
            obj.MASK_ACL_READ = mode.MASKS.ACL.READ;
            obj.MASK_ACL_WRITE = mode.MASKS.ACL.WRITE;
            obj.MASK_ACL_EXEC = mode.MASKS.ACL.EXEC;

            apis.push(api.register(ns, obj));
        }

        bus.on("*", async (event, data) => {
            if (event.startsWith("node.")) {
                apis.forEach((api) => api.emit(event, data.node.path));
            }
        });

        bus.on("session.updated", async (event, data) => {
            apis.forEach((api) => api.emit(event, data.session.username, { _id: data.session._id }));
        });
    }
}

module.exports = new APIExporter();
