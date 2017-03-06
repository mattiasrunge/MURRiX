
import React from "react";
import Knockout from "components/knockout";
import Comment from "components/comment";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");
const loc = require("lib/location");
const ui = require("lib/ui");

class AuthPageReset extends Knockout {
    async getModel() {
        const model = {};

        model.loading = stat.create();
        model.password1 = ko.observable();
        model.password2 = ko.observable();
        model.username = ko.pureComputed(() => {
            return ko.unwrap(loc.current().email);
        });
        model.id = ko.pureComputed(() => {
            return ko.unwrap(loc.current().id);
        });

        model.changePassword = async () => {
            if (model.password1() !== model.password2()) {
                return stat.printError("Password does not match!");
            } else if (model.password1() === "") {
                return stat.printError("Password can not be empty!");
            }

            model.loading(true);

            try {
                await api.auth.passwordReset(model.username(), model.id(), model.password1());

                stat.printSuccess("Password reset successfully!");

                model.password1("");
                model.password2("");

                loc.goto({ page: "login", email: null, id: null });
            } catch (e) {
                console.error(e);
                stat.printError("Failed to reset password");
            }

            model.loading(false);
        };

        ui.setTitle("Password reset");

        model.dispose = () => {
            stat.destroy(model.loading);
        };


        return model;
    }

    getTemplate() {
        return (
            <div className="fadeInRight animated">
                <div className="page-header">
                    <h1>Reset password for <span data-bind="text: username"></span></h1>
                </div>
                <div className="row">
                    <div className="col-md-6">
                        <form className="form-horizontal clearfix" role="form" data-bind="submit: changePassword" autoComplete="off">
                            <div className="form-group">
                                <label htmlFor="inputPassword1" className="col-lg-3 col-form-label">Password</label>
                                <div className="col-lg-9">
                                    <input type="password" className="form-control" id="inputPassword1" placeholder="New password" data-bind="value: password1, disable: loading" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="inputPassword2" className="col-lg-3 col-form-label">&nbsp;</label>
                                <div className="col-lg-9">
                                    <input type="password" className="form-control" id="inputPassword2" placeholder="Confirm password" data-bind="value: password2, disable: loading" />
                                </div>
                            </div>
                            <div className="form-group">
                                <div className="col-lg-offset-3 col-lg-9 clearfix">
                                    <a href="#" className="btn btn-primary" data-bind="disable: loading, click: changePassword">Change password</a>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div className="col-md-6">
                        <div className="box box-content" style={{ marginTop: "0" }}>
                            <h5>If you have not requested model password change</h5>
                            <p>
                                Please do nothing or contact the site administrator to report it.
                            </p>

                            <h5>If you have requested model password change</h5>
                            <p>
                                Please enter the new password and confirm the change.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

        );
    }
}

export default AuthPageReset;
