
import React from "react";
import Knockout from "components/knockout";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");
const session = require("lib/session");
const loc = require("lib/location");
const ui = require("lib/ui");

class AuthPageLogin extends Knockout {
    async getModel() {
        const model = {};

        model.user = session.user;
        model.loggedIn = session.loggedIn;
        model.username = ko.observable();
        model.password = ko.observable();
        model.loading = stat.create();
        model.loginDisallowed = ko.pureComputed(() => {
            return model.loading() || model.username() === "" || model.password() === "";
        });

        model.login = async () => {
            if (model.loginDisallowed()) {
                return;
            }

            model.loading(true);

            try {
                await api.auth.login(model.username(), model.password());
                await session.loadUser();

                stat.printSuccess("Login successfull, welcome " + session.user().attributes.name + "!");

                model.username("");
                model.password("");

                if (loc.current().path) {
                    loc.goto({ page: "node" });
                } else {
                    loc.goto({ page: null }, false);
                }
            } catch (e) {
                console.error(e);
                stat.printError("Login failed");
            }

            model.loading(false);
        };

        model.logout = async () => {
            model.loading(true);

            try {
                await api.auth.logout();
                await session.loadUser();
                stat.printSuccess("Logout successfull");

                loc.goto({ page: "login" });
            } catch (e) {
                console.error(e);
                stat.printError("Logout failed");
            }

            model.loading(false);
        };

        model.reset = async () => {
            if (model.username() === "") {
                return stat.printError("Please enter an e-mail address to reset password");
            }

            model.loading(true);

            try {
                await api.auth.requestReset(model.username(), document.location.origin);
                stat.printSuccess("Password reset e-mail sent!");
            } catch (e) {
                console.error(e);
                stat.printError("Failed to send password reset e-mail");
            }

            model.loading(false);
        };

        ui.setTitle("Login");

        model.dispose = () => {
            stat.destroy(model.loading);
        };


        return model;
    }

    getTemplate() {
        return (
            <div className="fadeInRight animated">
                <div className="page-header">
                    <h1>Login</h1>
                </div>
                <div className="row">
                    <div className="col-md-6">
                        <form className="form clearfix" data-bind="submit: login, if: !loggedIn()">
                            <div className="form-group label-floating">
                                <label htmlFor="username" className="control-label">E-Mail</label>
                                <input type="text" className="form-control" id="username" data-bind="textInput: username, disable: loading" />
                            </div>
                            <div className="form-group label-floating">
                                <label htmlFor="password" className="control-label">Password</label>
                                <input type="password" className="form-control" id="password" data-bind="textInput: password, disable: loading" />
                            </div>
                            <div className="form-group">
                                <button type="submit" className="btn btn-raised btn-primary pull-right" data-bind="disable: loginDisallowed">Login</button>
                                <button className="btn btn-link pull-right" data-bind="disable: loading, click: reset">Forgot your password?</button>
                            </div>
                        </form>
                        <div className="" data-bind="visible: loggedIn">
                            <button className="btn btn-raised btn-primary" data-bind="disable: loading, click: logout">Logout</button>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="box box-content" style={{ marginTop: "0" }}>
                            <h4>Don't have an account?</h4>
                            <p>
                                To be allowed to login you need to have an account. If you do not have an account please contact the site administrator for one.
                            </p>

                            <h4>Forgot your password?</h4>
                            <p>
                                If you have forgot your password, you can use the password reset function by pressing the <mark><small>Forgot your password?</small></mark> link. An email will be sent to the registered email with a special link. The link will allow you to set a new password.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

        );
    }
}

export default AuthPageLogin;
