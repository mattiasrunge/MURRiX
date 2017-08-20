
import React from "react";
import Knockout from "components/knockout";
import Comment from "components/comment";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");

class NodeSectionShare extends Knockout {
    async getModel() {
        const model = {};

        model.nodepath = ko.pureComputed(() => ko.unwrap(this.props.nodepath));
        model.loading = stat.create();
        model.saving = stat.create();
        model.gid = ko.observable(false);
        model.public = ko.observable(false);
        model.showInactive = ko.observable(false);
        model.groupAccess = ko.observable("none");
        model.aclGid = ko.observable(false);
        model.aclGroupAccess = ko.observable("read");

        model.saving(true); // While we load we don't want so save

        model.saveAccess = async () => {
            if (model.gid() === false) {
                throw new Error("A group must be specified!");
            }

            if (ko.unwrap(model.nodepath().node).properties.gid !== model.gid()) {
                await api.vfs.chown(model.nodepath().path, null, parseInt(model.gid(), 10), { recursive: true });
            }

            let mode = 0;

            mode |= ko.unwrap(model.nodepath().node).properties.mode & api.vfs.MASK_OWNER_READ ? api.vfs.MASK_OWNER_READ : 0;
            mode |= ko.unwrap(model.nodepath().node).properties.mode & api.vfs.MASK_OWNER_WRITE ? api.vfs.MASK_OWNER_WRITE : 0;
            mode |= ko.unwrap(model.nodepath().node).properties.mode & api.vfs.MASK_OWNER_EXEC ? api.vfs.MASK_OWNER_EXEC : 0;

            mode |= model.groupAccess() === "read" || model.groupAccess() === "write" ? api.vfs.MASK_GROUP_READ : 0;
            mode |= model.groupAccess() === "write" ? api.vfs.MASK_GROUP_WRITE : 0;
            mode |= model.groupAccess() === "read" || model.groupAccess() === "write" ? api.vfs.MASK_GROUP_EXEC : 0;

            mode |= model.public() ? api.vfs.MASK_OTHER_READ : 0;
            mode |= ko.unwrap(model.nodepath().node).properties.mode & api.vfs.MASK_OTHER_WRITE ? api.vfs.MASK_OTHER_WRITE : 0;
            mode |= model.public() ? api.vfs.MASK_OTHER_EXEC : 0;

            if (mode !== ko.unwrap(model.nodepath().node).properties.mode) {
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
        };

        model.aclGroupList = ko.pureComputed(() => {
            if (!model.nodepath()) {
                return [];
            }

            if (!ko.unwrap(model.nodepath().node).properties.acl) {
                return [];
            }

            let list = [];

            for (let ac of ko.unwrap(model.nodepath().node).properties.acl) {
                if (ac.gid) {
                    let access = "none";
                    access = ac.mode & api.vfs.MASK_ACL_READ ? "read" : access;
                    access = ac.mode & api.vfs.MASK_ACL_WRITE ? "write" : access;

                    list.push({ gid: ac.gid, access: ko.observable(access) });
                }
            }

            return list;
        });

        model.onSave = () => {
            model.saveAccess()
            .then(() => {
                model.saving(false);
                stat.printSuccess("Share settings saved successfully!");
            })
            .catch((error) => {
                model.saving(false);
                stat.printError(error);
            });
        };

        /*model.changed = ko.computed(() => {
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
        }).extend({ notify: "always" });*/

        model.whoHasAccess = ko.asyncComputed([], async () => {
            if (!model.nodepath()) {
                return [];
            }

            model.showInactive(); // Setup subscription

            let list = [];

            model.loading(true);

            list.push({
                name: await api.auth.name(ko.unwrap(model.nodepath().node).properties.uid),
                uid: ko.unwrap(model.nodepath().node).properties.uid,
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
                    if (!user.node.attributes.inactive || model.showInactive()) {
                        list.push({
                            name: user.node.attributes.name,
                            uid: user.node.attributes.uid,
                            type: model.groupAccess(),
                            reason: "as member of " + niceName
                        });
                    }
                }
            }

            for (let ac of model.aclGroupList()) {
                if (ac.access() !== "none") {
                    let name = await api.auth.gname(ac.gid);
                    let niceName = await api.auth.gnameNice(ac.gid);
                    let users = await api.auth.userList(name);

                    for (let user of users) {
                        if (!user.node.attributes.inactive || model.showInactive()) {
                            list.push({
                                name: user.node.attributes.name,
                                uid: user.node.attributes.uid,
                                type: ac.access(),
                                reason: "as member of " + niceName
                            });
                        }
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

        model.gid(ko.unwrap(model.nodepath().node).properties.gid);
        model.public(ko.unwrap(model.nodepath().node).properties.mode & api.vfs.MASK_OTHER_READ);
        model.groupAccess(ko.unwrap(model.nodepath().node).properties.mode & api.vfs.MASK_GROUP_READ ? "read" : model.groupAccess());
        model.groupAccess(ko.unwrap(model.nodepath().node).properties.mode & api.vfs.MASK_GROUP_WRITE ? "write" : model.groupAccess());

        model.saving(false);

        model.dispose = () => {
            //model.changed.dispose();
            stat.destroy(model.loading);
        };


        return model;
    }

    getTemplate() {
        return (
            ﻿<div className="fadeInDown animated node-content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-md-6">
                            <h3>Public access</h3>
                            <p>
                                Public access can be granted on <span data-bind="react: { name: 'node-widget-type', params: { type: ko.unwrap(nodepath().node).properties.type } }"></span>s if needed. This will allow anyone with the link to access model <span data-bind="react: { name: 'node-widget-type', params: { type: ko.unwrap(nodepath().node).properties.type } }"></span>. <em>Use with care!</em>
                            </p>
                            <div className="form-group">
                                <div className="checkbox">
                                    <label>
                                        <input type="checkbox" data-bind="checked: public" /> Public
                                    </label>
                                </div>
                            </div>

                            <h3>Primary group access</h3>
                            <p>
                                A group can be given read and write access model <span data-bind="react: { name: 'node-widget-type', params: { type: ko.unwrap(nodepath().node).properties.type } }"></span>. This will grant the group the selected rights on model <span data-bind="react: { name: 'node-widget-type', params: { type: ko.unwrap(nodepath().node).properties.type } }"></span>.
                            </p>
                            <table className="table table-condensed table-striped">
                                <thead>
                                    <tr>
                                        <th>Group</th>
                                        <th>Access</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>
                                            <input type="text" className="form-control" placeholder="Select a group" data-bind="groupselect: { gid: gid }" />
                                        </td>
                                        <td style={{ width: "30%" }}>
                                            <select className="form-control" data-bind="value: groupAccess, disable: saving">
                                                <option value="none">None</option>
                                                <option value="read">Read</option>
                                                <option value="write">Read and write</option>
                                            </select>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <h3>Extra group access</h3>
                            <p>
                                It is possible to give more groups access by adding them here.
                            </p>
                            <table className="table table-condensed table-striped">
                                <thead>
                                    <tr>
                                        <th>Group</th>
                                        <th>Access</th>
                                    </tr>
                                </thead>
                                <tbody data-bind="foreach: aclGroupList">
                                    <tr>
                                        <td style={{ fontWeight: "700", color: "#2d6ca2", padding: "12px" }} data-bind="gnameNice: $data.gid"></td>
                                        <td style={{ width: "30%" }}>
                                            <select className="form-control" data-bind="value: $data.access, disable: $root.saving">
                                                <option value="none">None</option>
                                                <option value="read">Read</option>
                                                <option value="write">Read and write</option>
                                            </select>
                                        </td>
                                    </tr>
                                </tbody>
                                <tbody>
                                    <tr>
                                        <td>
                                            <input type="text" className="form-control" placeholder="Add a group" data-bind="groupselect: { gid: aclGid }, disable: saving" />
                                        </td>
                                        <td style={{ width: "30%" }}>
                                            <select className="form-control" data-bind="value: aclGroupAccess, disable: saving">
                                                <option value="read">Read</option>
                                                <option value="write">Read and write</option>
                                            </select>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <button className="btn btn-primary" data-bind="click: onSave">Save changes</button>
                        </div>

                        <div className="col-md-6">
                            <h3>Who has access</h3>
                            <p>
                                Here is a list of all the users that have access and what access level they have. This is based on what groups are selected to the left and what access level they are granted.
                            </p>
                            <div className="form-group">
                                <div className="checkbox">
                                    <label>
                                        <input type="checkbox" data-bind="checked: showInactive" /> Show inactive users
                                    </label>
                                </div>
                            </div>
                            <div>
                                <table className="table table-condensed table-striped">
                                    <tbody data-bind="foreach: whoHasAccess">
                                        <tr>
                                            <td>
                                                <span data-bind="if: $data.uid">
                                                    <span data-bind="react: { name: 'auth-widget-picture-user', params: { size: 20, uid: $data.uid, classes: 'rounded-circle' } }" style={{ marginRight: "10px" }} className="float-left"></span>
                                                </span>
                                                <span data-bind="text: $data.name"></span>
                                            </td>
                                            <td>
                                                <span data-bind="visible: $data.type == 'read'">Read access</span>
                                                <span data-bind="visible: $data.type == 'write'">Read and write access</span>
                                                <span data-bind="text: $data.reason"></span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        );
    }
}

export default NodeSectionShare;
