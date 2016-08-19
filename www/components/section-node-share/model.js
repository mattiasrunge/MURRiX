"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");
const node = require("lib/node");

module.exports = utils.wrapComponent(function*(params) {
    this.nodepath = params.nodepath;
    this.loading = stat.create();
    this.saving = stat.create();
    this.gid = ko.observable(false);
    this.public = ko.observable(false);
    this.groupAccess = ko.observable("none");
    this.aclGid = ko.observable(false);
    this.aclGroupAccess = ko.observable("read");

    this.saving(true); // While we load we don't want so save

    this.saveAccess = utils.co(function*() {
        if (this.gid() === false) {
            throw new Error("A group must be specified!");
        }

        if (this.nodepath().node().properties.gid !== this.gid()) {
            yield api.vfs.chown(this.nodepath().path, null, parseInt(this.gid(), 10), { recursive: true });
        }

        let mode = 0;

        mode += this.nodepath().node().properties.mode & api.vfs.MASK_OWNER_READ ? api.vfs.MASK_OWNER_READ : 0;
        mode += this.nodepath().node().properties.mode & api.vfs.MASK_OWNER_WRITE ? api.vfs.MASK_OWNER_WRITE : 0;
        mode += this.nodepath().node().properties.mode & api.vfs.MASK_OWNER_EXEC ? api.vfs.MASK_OWNER_EXEC : 0;
        mode += this.groupAccess() === "read" || this.groupAccess() === "write" ? parseInt("040", 8) : 0;
        mode += this.groupAccess() === "write" ? api.vfs.MASK_GROUP_WRITE : 0;
        mode += this.groupAccess() === "read" || this.groupAccess() === "write" ? api.vfs.MASK_GROUP_EXEC : 0;
        mode += this.public() ? api.vfs.MASK_OTHER_READ : 0;
        mode += this.nodepath().node().properties.mode & api.vfs.MASK_OTHER_WRITE ? api.vfs.MASK_OTHER_WRITE : 0;
        mode += this.public() ? api.vfs.MASK_OTHER_EXEC : 0;

        console.log(utils.modeString(this.nodepath().node().properties.mode), "=>", utils.modeString(mode));

        if (mode !== this.nodepath().node().properties.mode) {
            yield api.vfs.chmod(this.nodepath().path, mode.toString(8), { recursive: true });
        }

        for (let ac of this.aclGroupList()) {
            let mode = 0;

            if (ac.access() === "write") {
                mode |= api.vfs.MASK_ACL_READ;
                mode |= api.vfs.MASK_ACL_WRITE;
                mode |= api.vfs.MASK_ACL_;
            } else if (ac.access() === "read") {
                mode |= api.vfs.MASK_ACL_READ;
                mode |= api.vfs.MASK_ACL_EXEC;
            }

            yield api.vfs.setfacl(this.nodepath().path, { gid: ac.gid, mode: mode }, { recursive: true });
        }

        if (this.aclGid()) {
            let mode = 0;

            if (this.aclGroupAccess() === "write") {
                mode |= api.vfs.MASK_ACL_READ
                mode |= api.vfs.MASK_ACL_WRITE;
                mode |= api.vfs.MASK_ACL_EXEC;
            } else if (this.aclGroupAccess() === "read") {
                mode |= api.vfs.MASK_ACL_READ;
                mode |= api.vfs.MASK_ACL_EXEC;
            }

            yield api.vfs.setfacl(this.nodepath().path, { gid: this.aclGid(), mode: mode }, { recursive: true });

            this.aclGid(false);
            this.aclGroupAccess("read")
        }

        let node = yield api.vfs.resolve(this.nodepath().path);

        this.nodepath().node(node);
    }.bind(this));

    this.aclGroupList = ko.pureComputed(() => {
        if (!this.nodepath()) {
            return [];
        }

        if (!this.nodepath().node().properties.acl) {
            return [];
        }

        let list = [];

        for (let ac of this.nodepath().node().properties.acl) {
            if (ac.gid) {
                let access = "none";
                access = ac.mode & api.vfs.MASK_ACL_READ ? "read" : access;
                access = ac.mode & api.vfs.MASK_ACL_WRITE ? "write" : access;

                list.push({ gid: ac.gid, access: ko.observable(access) });
            }
        }

        return list;
    });

    this.changed = ko.computed(() => {
        this.gid();
        this.groupAccess();
        this.public();
        this.aclGid();
        for (let ac of this.aclGroupList()) {
            ac.access();
        }

        if (!this.saving.peek()) {
            this.saving(true);
            this.saveAccess()
            .then(() => {
                this.saving(false);
                stat.printSuccess("Share settings saved successfully!");
            })
            .catch((error) => {
                this.saving(false);
                stat.printError(error);
            });
        }
    }).extend({ notify: "always" });

    this.whoHasAccess = ko.asyncComputed([], function*() {
        if (!this.nodepath()) {
            return [];
        }

        let list = [];

        this.loading(true);

        list.push({
            name: yield api.auth.name(this.nodepath().node().properties.uid),
            uid: this.nodepath().node().properties.uid,
            type: "write",
            reason: "as owner"
        });

        if (this.public()) {
            list.push({
                name: "Everyone",
                type: "read",
                reason: "since node is public"
            });
        }

        if (this.gid() && this.groupAccess() !== "none") {
            let name = yield api.auth.gname(this.gid());
            let niceName = yield api.auth.gnameNice(this.gid());
            let users = yield api.auth.userList(name);

            for (let user of users) {
                list.push({
                    name: user.node.attributes.name,
                    uid: user.node.attributes.uid,
                    type: this.groupAccess(),
                    reason: "as member of " + niceName
                });
            }
        }

        for (let ac of this.aclGroupList()) {
            if (ac.access() !== "none") {
                let name = yield api.auth.gname(ac.gid);
                let niceName = yield api.auth.gnameNice(ac.gid);
                let users = yield api.auth.userList(name);

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

        this.loading(false);

        return list;
    }.bind(this), (error) => {
        this.loading(false);
        stat.printError(error);
    });

    this.gid(this.nodepath().node().properties.gid);
    this.public(this.nodepath().node().properties.mode & api.vfs.MASK_OTHER_READ);
    this.groupAccess(this.nodepath().node().properties.mode & api.vfs.MASK_GROUP_READ ? "read" : this.groupAccess());
    this.groupAccess(this.nodepath().node().properties.mode & api.vfs.MASK_GROUP_WRITE ? "write" : this.groupAccess());

    this.saving(false);

    this.dispose = () => {
        this.changed.dispose();
        stat.destroy(this.loading);
    };
});
