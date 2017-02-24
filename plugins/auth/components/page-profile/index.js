
import React from "react";
import Knockout from "components/knockout";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const session = require("lib/session");
const ui = require("lib/ui");

class AuthPageProfile extends Knockout {
    async getModel() {
        const model = {};

        model.user = session.user;
        model.username = session.username;
        model.personPath = session.personPath;
        model.loggedIn = session.loggedIn;
        model.groupList = ko.observableArray();

        model.groupList(await api.auth.groupList(session.username()));

        ui.setTitle("Profile");


        return model;
    }

    getTemplate() {
        return (
            ﻿<div className="fadeInRight animated">
                <div className="page-header">
                    <h1>Profile</h1>
                </div>

                <div className="row" data-bind="visible: loggedIn">
                    <div className="col-md-5" style={{ paddingRight: "0" }}>
                        <div className="box box-content" style={{ marginTop: "0", paddingBottom: "0" }}>
                            <div data-bind="react: { name: 'auth-widget-edit-user', params: { user: user, username: username, personPath: personPath } }"></div>
                        </div>
                    </div>
                    <div className="col-md-7" data-bind="if: user">
                        <div className="box box-content" style={{ marginTop: "0", paddingBottom: "0" }}>
                            <h3>Properties</h3>
                            <table className="table table-striped" style={{ fontSize: "12px" }}>
                                <tbody>
                                    <tr>
                                        <td><strong>Last login</strong></td>
                                        <td data-bind="datetimeAgo: user().attributes.loginTime"></td>
                                    </tr>
                                    <tr>
                                        <td><strong>Created</strong></td>
                                        <td data-bind="datetimeAgo: user().properties.birthtime"></td>
                                    </tr>
                                    <tr>
                                        <td><strong>Modified</strong></td>
                                        <td data-bind="datetimeAgo: user().properties.mtime"></td>
                                    </tr>
                                </tbody>
                            </table>

                            <h3>Group memberships</h3>
                            <div data-bind="react: { name: 'auth-widget-list-groups', params: { list: groupList } }"></div>
                        </div>
                    </div>
                </div>
            </div>

        );
    }
}

export default AuthPageProfile;
