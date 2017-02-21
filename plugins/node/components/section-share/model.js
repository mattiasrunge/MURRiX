"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");

model.nodepath = params.nodepath;
model.loading = stat.create();
model.saving = stat.create();
model.gid = ko.observable(false);
model.public = ko.observable(false);
model.groupAccess = ko.observable("none");
model.aclGid = ko.observable(false);
model.aclGroupAccess = ko.observable("read");

model.saving(true); // While we load we don't want so save

model.saveAccess = async () => {
    if (model.gid() === false) {
        throw new Error("A group must be specified!");
    }

    if (model.nodepath().node().properties.gid !== model.gid()) {
        await api.vfs.chown(model.nodepath().path, null, parseInt(model.gid(), 10), { recursive: true });
    }

    let mode = 0;

    mode |= model.nodepath().node().properties.mode & api.vfs.MASK_OWNER_READ ? api.vfs.MASK_OWNER_READ : 0;
    mode |= model.nodepath().node().properties.mode & api.vfs.MASK_OWNER_WRITE ? api.vfs.MASK_OWNER_WRITE : 0;
    mode |= model.nodepath().node().properties.mode & api.vfs.MASK_OWNER_EXEC ? api.vfs.MASK_OWNER_EXEC : 0;

    mode |= model.groupAccess() === "read" || model.groupAccess() === "write" ? api.vfs.MASK_GROUP_READ : 0;
    mode |= model.groupAccess() === "write" ? api.vfs.MASK_GROUP_WRITE : 0;
    mode |= model.groupAccess() === "read" || model.groupAccess() === "write" ? api.vfs.MASK_GROUP_EXEC : 0;

    mode |= model.public() ? api.vfs.MASK_OTHER_READ : 0;
    mode |= model.nodepath().node().properties.mode & api.vfs.MASK_OTHER_WRITE ? api.vfs.MASK_OTHER_WRITE : 0;
    mode |= model.public() ? api.vfs.MASK_OTHER_EXEC : 0;

    if (mode !== model.nodepath().node().properties.mode) {
        await api.vfs.chmod(model.nodepath().path, mode, { recursive: true });
    }

    for (let ac of model.aclGroupList()) {
        let mode = 0;

        if (ac.access() === "write") {
            mode |= api.vfs.MASK_ACL_READ;
            mode |= api.vfs.MASK_ACL_WRITE;
            mode |= api.vfs.MASK_ACL_;
        } else if (ac.access() === "read") {
            mode |= api.vfs.MASK_ACL_READ;
            mode |= api.vfs.MASK_ACL_EXEC;
        }

        await api.vfs.setfacl(model.nodepath().path, { gid: ac.gid, mode: mode }, { recursive: true });
    }

    if (model.aclGid()) {
        let mode = 0;

        if (model.aclGroupAccess() === "write") {
            mode |= api.vfs.MASK_ACL_READ;
            mode |= api.vfs.MASK_ACL_WRITE;
            mode |= api.vfs.MASK_ACL_EXEC;
        } else if (model.aclGroupAccess() === "read") {
            mode |= api.vfs.MASK_ACL_READ;
            mode |= api.vfs.MASK_ACL_EXEC;
        }

        await api.vfs.setfacl(model.nodepath().path, { gid: model.aclGid(), mode: mode }, { recursive: true });

        model.aclGid(false);
        model.aclGroupAccess("read");
    }

    let node = await api.vfs.resolve(model.nodepath().path);

    model.nodepath().node(node);
};

model.aclGroupList = ko.pureComputed(() => {
    if (!model.nodepath()) {
        return [];
    }

    if (!model.nodepath().node().properties.acl) {
        return [];
    }

    let list = [];

    for (let ac of model.nodepath().node().properties.acl) {
        if (ac.gid) {
            let access = "none";
            access = ac.mode & api.vfs.MASK_ACL_READ ? "read" : access;
            access = ac.mode & api.vfs.MASK_ACL_WRITE ? "write" : access;

            list.push({ gid: ac.gid, access: ko.observable(access) });
        }
    }

    return list;
});

model.changed = ko.computed(() => {
    model.gid();
    model.groupAccess();
    model.public();
    model.aclGid();
    for (let ac of model.aclGroupList()) {
        ac.access();
    }

    if (!model.saving.peek()) {
        model.saving(true);
        model.saveAccess()
        .then(() => {
            model.saving(false);
            stat.printSuccess("Share settings saved successfully!");
        })
        .catch((error) => {
            model.saving(false);
            stat.printError(error);
        });
    }
}).extend({ notify: "always" });

model.whoHasAccess = ko.asyncComputed([], async () => {
    if (!model.nodepath()) {
        return [];
    }

    let list = [];

    model.loading(true);

    list.push({
        name: await api.auth.name(model.nodepath().node().properties.uid),
        uid: model.nodepath().node().properties.uid,
        type: "write",
        reason: "as owner"
    });

    if (model.public()) {
        list.push({
            name: "Everyone",
            type: "read",
            reason: "since node is public"
        });
    }

    if (model.gid() && model.groupAccess() !== "none") {
        let name = await api.auth.gname(model.gid());
        let niceName = await api.auth.gnameNice(model.gid());
        let users = await api.auth.userList(name);

        for (let user of users) {
            list.push({
                name: user.node.attributes.name,
                uid: user.node.attributes.uid,
                type: model.groupAccess(),
                reason: "as member of " + niceName
            });
        }
    }

    for (let ac of model.aclGroupList()) {
        if (ac.access() !== "none") {
            let name = await api.auth.gname(ac.gid);
            let niceName = await api.auth.gnameNice(ac.gid);
            let users = await api.auth.userList(name);

            for (let user of users) {
                list.push({
                    name: user.node.attributes.name,
                    uid: user.node.attributes.uid,
                    type: ac.access(),
                    reason: "as member of " + niceName
                });
            }
        }
    }

    list.sort((a, b) => {
        if (a.type === "write" && b.type === "read") {
            return -1;
        } else if (b.type === "write" && a.type === "read") {
            return 1;
        }

        return 0;
    });

    let uidList = [];

    list = list.filter((item) => {
        if (!uidList.includes(item.uid)) {
            uidList.push(item.uid);
            return true;
        }

        return false;
    });

    model.loading(false);

    return list;
}, (error) => {
    model.loading(false);
    stat.printError(error);
});

model.gid(model.nodepath().node().properties.gid);
model.public(model.nodepath().node().properties.mode & api.vfs.MASK_OTHER_READ);
model.groupAccess(model.nodepath().node().properties.mode & api.vfs.MASK_GROUP_READ ? "read" : model.groupAccess());
model.groupAccess(model.nodepath().node().properties.mode & api.vfs.MASK_GROUP_WRITE ? "write" : model.groupAccess());

model.saving(false);

const dispose = () => {
    model.changed.dispose();
    stat.destroy(model.loading);
};
