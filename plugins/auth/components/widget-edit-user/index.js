
import React from "react";
import Knockout from "components/knockout";

const ko = require("knockout");
const api = require("api.io-client");
const stat = require("lib/status");
const session = require("lib/session");
const loc = require("lib/location");

class AuthWidgetEditUser extends Knockout {
    async getModel() {
        const model = {};

        model.loading = stat.create();
        model.name = ko.observable("");
        model.username = ko.observable("");
        model.email = ko.observable("");
        model.password1 = ko.observable("");
        model.password2 = ko.observable("");
        model.personPath = ko.observable(false);

        let subscription = this.props.user.subscribe(() => model.reset());

        model.reset = () => {
            model.password1("");
            model.password2("");

            model.name(this.props.user().attributes.name);
            model.username(this.props.username());
            model.email(this.props.user().attributes.email);
            model.personPath(this.props.personPath());
        };

        model.save = async () => {
            if (model.username() === "") {
                return stat.printError("Username can not be empty!");
            }

            model.loading(true);

            try {
                await api.auth.saveProfile(this.props.username(), {
                    name: model.name()
                }, model.personPath());

                if (this.props.username() !== model.username()) {
                    await api.auth.changeUsername(this.props.username(), model.username());

                    if (this.props.username() === session.username()) {
                        stat.printInfo("After username change you must login again");
                        await api.auth.logout();
                        await session.loadUser();
                        loc.goto({ page: "login" });
                    }
                }

                stat.printSuccess("Profile saved successfully!");
            } catch (e) {
                console.error(e);
                stat.printError("Failed to save user");
            }

            model.loading(false);
        };

        model.changePassword = async () => {
            if (model.password1() !== model.password2()) {
                return stat.printError("Password does not match!");
            } else if (model.password1() === "") {
                return stat.printError("Password can not be empty!");
            }

            model.loading(true);

            try {
                await api.auth.passwd(this.props.username(), model.password1());

                stat.printSuccess("Password changed successfully!");

                model.password1("");
                model.password2("");
            } catch (e) {
                console.error(e);
                stat.printError("Failed to change password");
            }

            model.loading(false);
        };

        model.reset();

        model.dispose = () => {
            stat.destroy(model.loading);
            subscription.dispose();
        };


        return model;
    }

    getTemplate() {
        return (
            <div>
                <div>
                    <form className="form-horizontal clearfix" role="form" data-bind="submit: save" autoComplete="off">
                        <div className="form-group row">
                            <label htmlFor="inputName" className="col-lg-3 col-form-label">Name</label>
                            <div className="col-lg-9">
                                <input type="text" className="form-control" id="inputName" placeholder="Name" data-bind="value: name, disable: loading" />
                            </div>
                        </div>
                        <div className="form-group row">
                            <label htmlFor="inputUsername" className="col-lg-3 col-form-label">E-Mail</label>
                            <div className="col-lg-9">
                                <input type="text" className="form-control" id="inputUsername" placeholder="E-Mail" data-bind="value: username, disable: loading" />
                            </div>
                        </div>
                        <div className="form-group row">
                            <label htmlFor="inputPerson" className="col-lg-3 col-form-label">Person</label>
                            <div className="col-lg-9">
                                <input type="text" className="form-control" id="inputPerson" placeholder="Select a person" data-bind="nodeselect: { root: '/people', path: personPath }" />
                            </div>
                        </div>
                        <div className="form-group row">
                            <div className="col-lg-3"></div>
                            <div className="col-lg-9 clearfix">
                                <a href="#" className="btn btn-primary" data-bind="disable: loading, click: save">Save</a>
                                <a href="#" className="btn btn-secondary" data-bind="disable: loading, click: reset">Reset</a>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="top-border" style={{ paddingTop: "15px" }}>
                    <form className="form-horizontal clearfix" role="form" data-bind="submit: changePassword" autoComplete="off">
                        <div className="form-group row">
                            <label htmlFor="inputPassword1" className="col-lg-3 col-form-label">Password</label>
                            <div className="col-lg-9">
                                <input type="password" className="form-control" id="inputPassword1" placeholder="Password" data-bind="value: password1, disable: loading" />
                            </div>
                        </div>
                        <div className="form-group row">
                            <label htmlFor="inputPassword2" className="col-lg-3 col-form-label">&nbsp;</label>
                            <div className="col-lg-9">
                                <input type="password" className="form-control" id="inputPassword2" placeholder="Confirm password" data-bind="value: password2, disable: loading" />
                            </div>
                        </div>
                        <div className="form-group row">
                            <div className="col-lg-3"></div>
                            <div className="col-lg-9 clearfix">
                                <a href="#" className="btn btn-primary" data-bind="disable: loading, click: changePassword">Change password</a>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

        );
    }
}

export default AuthWidgetEditUser;
