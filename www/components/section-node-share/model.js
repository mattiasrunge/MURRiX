﻿"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");
const node = require("lib/node");

module.exports = utils.wrapComponent(function*(params) {
    this.nodepath = params.nodepath;
    this.loading = stat.create();
    this.gid = ko.observable(false);
    this.public = ko.observable(false);
    this.groupAccess = ko.observable("none");
    this.aclGid = ko.observable(false);
    this.aclGroupAccess = ko.observable("read");

    this.saveAccess = utils.co(function*() {
        if (this.gid() === false) {
            throw new Error("A group must be specified!");
        }

        if (this.nodepath().node().properties.gid !== this.gid()) {
            yield api.vfs.chown(this.nodepath().path, null, parseInt(this.gid(), 10), { recursive: true });
        }

        let mode = 0;

        mode += this.nodepath().node().properties.mode & parseInt("400", 8) ? parseInt("400", 8) : 0;
        mode += this.nodepath().node().properties.mode & parseInt("200", 8) ? parseInt("200", 8) : 0;
        mode += this.nodepath().node().properties.mode & parseInt("100", 8) ? parseInt("100", 8) : 0;
        mode += this.groupAccess() === "read" || this.groupAccess() === "write" ? parseInt("040", 8) : 0;
        mode += this.groupAccess() === "write" ? parseInt("020", 8) : 0;
        mode += this.groupAccess() === "read" || this.groupAccess() === "write" ? parseInt("010", 8) : 0;
        mode += this.public() ? parseInt("004", 8) : 0;
        mode += this.nodepath().node().properties.mode & parseInt("002", 8) ? parseInt("002", 8) : 0;
        mode += this.public() ? parseInt("001", 8) : 0;

        console.log(utils.modeString(this.nodepath().node().properties.mode), "=>", utils.modeString(mode));

        if (mode !== this.nodepath().node().properties.mode) {
            yield api.vfs.chmod(this.nodepath().path, mode.toString(8), { recursive: true });
        }

        for (let ac of this.aclGroupList()) {
            let mode = 0;

            if (ac.access() === "write") {
                mode |= parseInt("004", 8);
                mode |= parseInt("002", 8);
                mode |= parseInt("001", 8);
            } else if (ac.access() === "read") {
                mode |= parseInt("004", 8);
                mode |= parseInt("001", 8);
            }

            yield api.vfs.setfacl(this.nodepath().path, { gid: ac.gid, mode: mode }, { recursive: true });
        }

        if (this.aclGid()) {
            let mode = 0;

            if (this.aclGroupAccess() === "write") {
                mode |= parseInt("004", 8);
                mode |= parseInt("002", 8);
                mode |= parseInt("001", 8);
            } else if (this.aclGroupAccess() === "read") {
                mode |= parseInt("004", 8);
                mode |= parseInt("001", 8);
            }

            yield api.vfs.setfacl(this.nodepath().path, { gid: this.aclGid(), mode: mode }, { recursive: true });

            this.aclGid(false);
            this.aclGroupAccess("read")
        }

        this.nodepath.reload();
    }.bind(this));

    let saving = true;

    this.setAccess = () => {
        saving = true;
        this.loading(true);
        this.saveAccess()
        .then(() => {
            saving = false;
            this.loading(false);
            stat.printSuccess("Share settings saved successfully!");

            node.reload();
        })
        .catch((error) => {
            saving = false;
            this.loading(false);
            stat.printError(error);
        });
    };

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
                access = ac.mode & parseInt("004", 8) ? "read" : access;
                access = ac.mode & parseInt("002", 8) ? "write" : access;

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
        this.aclGroupAccess();
        for (let ac of this.aclGroupList()) {
            ac.access();
        }

        console.log("CHANGED");

        if (!saving) {
            console.log("SAVE");
            this.setAccess();
        }
    }).extend({ notify: "always" });

    this.whoHasAccess = ko.asyncComputed([], function*() {
        if (!this.nodepath()) {
            return [];
        }

        let list = [];

        // Ko must subscribe before first yield
        this.changed();

        this.loading(true);

        list.push({
            name: yield api.auth.name(this.nodepath().node().properties.uid),
            uid: this.nodepath().node().properties.uid,
            type: "Owner"
        });

        if (this.public()) {
            list.push({
                name: "Everyone",
                type: "Read"
            });
        }

        if (this.gid() && this.groupAccess() !== "none") {
            let groupname = yield api.auth.gname(this.gid());
            let users = yield api.auth.userList(groupname);
            let type = this.groupAccess() === "write" ? "Read and write" : "Read";

            for (let user of users) {
                list.push({
                    name: user.node.attributes.name,
                    uid: user.node.attributes.uid,
                    type: type
                });
            }
        }

        if (this.aclGid()) {
            let groupname = yield api.auth.gname(this.aclGid());
            let users = yield api.auth.userList(groupname);
            let type = this.aclGroupAccess() === "write" ? "Read and write" : "Read";

            for (let user of users) {
                list.push({
                    name: user.node.attributes.name,
                    uid: user.node.attributes.uid,
                    type: type
                });
            }
        }

        for (let ac of this.aclGroupList()) {
            if (ac.access() !== "none") {
                let groupname = yield api.auth.gname(ac.gid);
                let users = yield api.auth.userList(groupname);
                let type = ac.access() === "write" ? "Read and write" : "Read";

                for (let user of users) {
                    list.push({
                        name: user.node.attributes.name,
                        uid: user.node.attributes.uid,
                        type: type
                    });
                }
            }
        }

        this.loading(false);

        return list;
    }.bind(this));

    this.gid(this.nodepath().node().properties.gid);
    this.public(this.nodepath().node().properties.mode & parseInt("004", 8));
    this.groupAccess(this.nodepath().node().properties.mode & parseInt("040", 8) ? "read" : this.groupAccess());
    this.groupAccess(this.nodepath().node().properties.mode & parseInt("020", 8) ? "write" : this.groupAccess());

    saving = false;

    this.dispose = () => {
        this.changed.dispose();
        stat.destroy(this.loading);
    };
});
