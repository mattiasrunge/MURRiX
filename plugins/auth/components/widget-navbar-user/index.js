
import React from "react";
import Knockout from "components/knockout";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");
const session = require("lib/session");

class AuthWidgetNavbarUser extends Knockout {
    async getModel() {
        const model = {};

        model.user = session.user;
        model.uid = ko.pureComputed(() => {
            if (!model.user()) {
                return false;
            }

            return model.user().attributes.uid;
        });
        model.personPath = session.personPath;
        model.loggedIn = session.loggedIn;
        model.loading = stat.create();

        model.logout = async () => {
            model.loading(true);

            try {
                await api.auth.logout();
                await session.loadUser();
                stat.printSuccess("Logout successfull");
            } catch (e) {
                console.error(e);
                stat.printError("Logout failed");
            }

            model.loading(false);
        };

        model.dispose = () => {
            stat.destroy(model.loading);
        };


        return model;
    }

    getTemplate() {
        return (
            <span>
                <li className="dropdown profile" data-bind="visible: loggedIn, if: loggedIn">
                    <a href="#" data-target="#" className="dropdown-toggle" data-toggle="dropdown"><span className="picture" style={{ width: "20px", height: "20px" }} data-bind=""><span data-bind="react: { name: 'auth-widget-picture-user', params: { size: 20, uid: uid, classes: 'img-circle' } }" className="picture pull-left"></span></span><span data-bind="text: user().attributes.name"></span> <b className="caret"></b></a>
                    <ul className="dropdown-menu">
                        <li>
                            <a href="#" data-bind="location: { page: 'profile' }">
                                <i className="material-icons">account_box</i>
                                &nbsp;&nbsp;
                                Profile
                            </a>
                        </li>
                        <li data-bind="visible: personPath, if: personPath">
                            <a href="#" data-bind="location: { page: 'node', path: personPath }">
                                <i className="material-icons">person</i>
                                &nbsp;&nbsp;
                                Me
                            </a>
                        </li>
                        <li className="divider"></li>
                        <li>
                            <a href="#" data-bind="click: logout">
                                <i className="material-icons">exit_to_app</i>
                                &nbsp;&nbsp;
                                Logout
                            </a>
                        </li>
                    </ul>
                </li>
                <li data-bind="visible: !loggedIn()">
                    <a href="#" data-bind="location: { page: 'login' }">
                        <i className="material-icons md-18">account_circle</i>
                        Login
                    </a>
                </li>
            </span>

        );
    }
}

export default AuthWidgetNavbarUser;
