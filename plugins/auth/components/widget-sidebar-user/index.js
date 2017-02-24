
import React from "react";
import Knockout from "components/knockout";

const ko = require("knockout");
const utils = require("lib/utils");
const session = require("lib/session");

class AuthWidgetSidebarUser extends Knockout {
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


        return model;
    }

    getTemplate() {
        return (
            <div className="profile" data-bind="visible: loggedIn, if: loggedIn">
                <div data-bind="react: { name: 'auth-widget-picture-user', params: { size: 40, uid: uid, classes: 'img-circle picture' } }" className="pull-left"></div>
                <div>
                    <div className="name" data-bind="text: user().attributes.name"></div>
                    <div>
                        <a href="#" data-bind="location: { page: 'profile' }">Profile</a>
                        <span data-bind="visible: personPath, if: personPath">
                            &nbsp;&bull;&nbsp;
                            <a href="#" data-bind="location: { page: 'node', path: personPath }">Me</a>
                        </span>
                    </div>
                </div>
            </div>

        );
    }
}

export default AuthWidgetSidebarUser;
