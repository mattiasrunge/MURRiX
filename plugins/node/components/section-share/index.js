
import React from "react";
import Knockout from "components/knockout";
// import NodeWidgetGroupAccess from "plugins/node/components/widget-group-access";

const ko = require("knockout");
const api = require("api.io-client");
const stat = require("lib/status");

const saveAccess = async (nodepath, data) => {
    if (data.gid === false) {
        throw new Error("A group must be specified!");
    }

    if (nodepath.node.properties.gid !== data.gid) {
        await api.vfs.chown(nodepath.path, null, parseInt(data.gid, 10), { recursive: true });
    }

    const currentMode = nodepath.node.properties.mode;
    let mode = 0;

    mode |= currentMode & api.vfs.MASK_OWNER_READ ? api.vfs.MASK_OWNER_READ : 0;
    mode |= currentMode & api.vfs.MASK_OWNER_WRITE ? api.vfs.MASK_OWNER_WRITE : 0;
    mode |= currentMode & api.vfs.MASK_OWNER_EXEC ? api.vfs.MASK_OWNER_EXEC : 0;

    mode |= data.groupAccess === "read" || data.groupAccess === "write" ? api.vfs.MASK_GROUP_READ : 0;
    mode |= data.groupAccess === "write" ? api.vfs.MASK_GROUP_WRITE : 0;
    mode |= data.groupAccess === "read" || data.groupAccess === "write" ? api.vfs.MASK_GROUP_EXEC : 0;

    mode |= data.public ? api.vfs.MASK_OTHER_READ : 0;
    mode |= currentMode & api.vfs.MASK_OTHER_WRITE ? api.vfs.MASK_OTHER_WRITE : 0;
    mode |= data.public ? api.vfs.MASK_OTHER_EXEC : 0;

    if (mode !== currentMode) {
        await api.vfs.chmod(nodepath.path, mode, { recursive: true });
    }

    for (const ac of data.aclGroupList) {
        let mode = 0;

        if (ac.access === "write") {
            mode |= api.vfs.MASK_ACL_READ;
            mode |= api.vfs.MASK_ACL_WRITE;
            mode |= api.vfs.MASK_ACL_;
        } else if (ac.access === "read") {
            mode |= api.vfs.MASK_ACL_READ;
            mode |= api.vfs.MASK_ACL_EXEC;
        }

        await api.vfs.setfacl(nodepath.path, { gid: ac.gid, mode: mode }, { recursive: true });
    }

    if (data.aclGid) {
        let mode = 0;

        if (data.aclGroupAccess === "write") {
            mode |= api.vfs.MASK_ACL_READ;
            mode |= api.vfs.MASK_ACL_WRITE;
            mode |= api.vfs.MASK_ACL_EXEC;
        } else if (data.aclGroupAccess === "read") {
            mode |= api.vfs.MASK_ACL_READ;
            mode |= api.vfs.MASK_ACL_EXEC;
        }

        await api.vfs.setfacl(nodepath.path, { gid: data.aclGid, mode: mode }, { recursive: true });
    }
};

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
            await saveAccess(ko.unwrap(model.nodepath), {
                gid: model.gid(),
                groupAccess: model.groupAccess(),
                public: model.public(),
                aclGroupList: model.aclGroupList().map((ac) => ({ gid: ac.gid, access: ac.access() })),
                aclGid: model.aclGid(),
                aclGroupAccess: model.aclGroupAccess()
            });

            model.aclGid(false);
            model.aclGroupAccess("read");
        };

        model.aclGroupList = ko.pureComputed(() => {
            if (!model.nodepath()) {
                return [];
            }

            const acl = ko.unwrap(model.nodepath().node).properties.acl;

            if (!acl) {
                return [];
            }

            return acl
                .filter((ac) => ac.gid)
                .map((ac) => {
                    let access = "none";
                    access = ac.mode & api.vfs.MASK_ACL_READ ? "read" : access;
                    access = ac.mode & api.vfs.MASK_ACL_WRITE ? "write" : access;

                    return {
                        gid: ac.gid,
                        access: ko.observable(access)
                    };
                });
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

        model.whoHasAccess = ko.asyncComputed([], async () => {
            if (!model.nodepath()) {
                return [];
            }

            model.showInactive(); // Setup subscription

            let list = [];

            model.loading(true);

            const uid = ko.unwrap(model.nodepath().node).properties.uid;

            list.push({
                name: await api.auth.name(uid),
                uid: uid,
                type: "write",
                reason: " as owner"
            });

            if (model.public()) {
                list.push({
                    name: "Everyone",
                    type: "read",
                    reason: " since node is public"
                });
            }

            if (model.gid() && model.groupAccess() !== "none") {
                const name = await api.auth.gname(model.gid());
                const niceName = await api.auth.gnameNice(model.gid());
                const users = await api.auth.userList(name);

                for (const user of users) {
                    if (!user.node.attributes.inactive || model.showInactive()) {
                        list.push({
                            name: user.node.attributes.name,
                            uid: user.node.attributes.uid,
                            type: model.groupAccess(),
                            reason: ` as member of ${niceName}`
                        });
                    }
                }
            }

            for (const ac of model.aclGroupList()) {
                if (ac.access() !== "none") {
                    const name = await api.auth.gname(ac.gid);
                    const niceName = await api.auth.gnameNice(ac.gid);
                    const users = await api.auth.userList(name);

                    for (const user of users) {
                        if (!user.node.attributes.inactive || model.showInactive()) {
                            list.push({
                                name: user.node.attributes.name,
                                uid: user.node.attributes.uid,
                                type: ac.access(),
                                reason: ` as member of ${niceName}`
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

            const uidList = [];

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

        const currentMode = ko.unwrap(model.nodepath().node).properties.mode;

        model.gid(ko.unwrap(model.nodepath().node).properties.gid);
        model.public(currentMode & api.vfs.MASK_OTHER_READ);
        model.groupAccess(currentMode & api.vfs.MASK_GROUP_READ ? "read" : model.groupAccess());
        model.groupAccess(currentMode & api.vfs.MASK_GROUP_WRITE ? "write" : model.groupAccess());

        model.saving(false);

        model.dispose = () => {
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
                            {/*<NodeWidgetGroupAccess
                                disabled={false}
                                path=""
                                access=""
                                onGroupSelect={(group) => console.log("group", group)}
                                onAccessSelect={(access) => console.log("access", access)}
                            />*/}
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
