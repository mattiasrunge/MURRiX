
/* global document */

import React from "react";
import Component from "lib/component";
import { Button, Form, FormGroup, Label, Input } from "reactstrap";
import ko from "knockout";
import api from "api.io-client";
import stat from "lib/status";
import session from "lib/session";
import loc from "lib/location";
import ui from "lib/ui";

class AuthPageLogin extends Component {
    constructor(props) {
        super(props);

        this.state = {
            user: ko.unwrap(session.user),
            loggedIn: ko.unwrap(session.loggedIn),
            username: "",
            password: "",
            loading: false
        };
    }

    componentDidMount() {
        this.addDisposables([
            session.user.subscribe((user) => this.setState({ user })),
            session.loggedIn.subscribe((loggedIn) => this.setState({ loggedIn }))
        ]);

        ui.setTitle("Login");
    }

    async logout() {
        this.setState({ loading: true });

        try {
            await api.auth.logout();
            await session.loadUser();
            stat.printSuccess("Logout successfull");
        } catch (e) {
            console.error(e);
            stat.printError("Logout failed");
        }

        this.setState({ loading: false });
    }

    async login(event) {
        event.preventDefault();

        this.setState({ loading: true });

        try {
            await api.auth.login(this.state.username, this.state.password);
            await session.loadUser();

            stat.printSuccess(`Login successfull, welcome ${session.user().attributes.name}!`);

            this.setState({ loading: false, username: "", password: "" });

            if (loc.get("path")) {
                loc.goto({ page: "node" });
            } else {
                loc.goto({ page: null }, false);
            }
        } catch (e) {
            this.setState({ loading: false });
            console.error(e);
            stat.printError("Login failed");
        }
    }

    async reset() {
        if (this.state.username === "") {
            return stat.printError("Please enter an e-mail address to reset password");
        }

        this.setState({ loading: true });

        try {
            await api.auth.requestReset(this.state.username, document.location.origin);
            stat.printSuccess("Password reset e-mail sent!");
        } catch (e) {
            console.error(e);
            stat.printError("Failed to send password reset e-mail");
        }

        this.setState({ loading: false });
    }

    render() {
        return (
            <div className="fadeInRight animated">
                <div className="page-header">
                    <h1>Login</h1>
                </div>

                <If condition={this.state.loggedIn}>
                    <Button
                        color="primary"
                        onClick={() => this.logout()}
                        disabled={this.state.loading}
                    >
                        Logout
                    </Button>
                </If>

                <If condition={!this.state.loggedIn}>
                    <div className="row">
                        <div className="col-md-6">
                            <Form onSubmit={(e) => this.login(e)}>
                                <FormGroup>
                                    <Label for="username">E-Mail</Label>
                                    <Input
                                        type="text"
                                        name="username"
                                        id="username"
                                        value={this.state.username}
                                        onChange={(e) => this.setState({ username: e.target.value })}
                                        disabled={this.state.loading}
                                    />
                                </FormGroup>
                                <FormGroup>
                                    <Label for="password">Password</Label>
                                    <Input
                                        type="password"
                                        name="password"
                                        id="password"
                                        value={this.state.password}
                                        onChange={(e) => this.setState({ password: e.target.value })}
                                        disabled={this.state.loading}
                                    />
                                </FormGroup>
                                <Button
                                    className="float-right"
                                    color="primary"
                                    disabled={this.state.loading}
                                >
                                    Login
                                </Button>
                                <Button
                                    className="float-right"
                                    color="link"
                                    onClick={() => this.reset()}
                                    disabled={this.state.loading}
                                >
                                    Forgot your password?
                                </Button>
                            </Form>
                        </div>
                        <div className="col-md-6">
                            <div className="box box-content" style={{ marginTop: "0" }}>
                                <h4>Don&apos;t have an account?</h4>
                                <p>
                                    To be allowed to login you need to have an account. If you do not have an account please contact the site administrator and request one.
                                </p>

                                <h4>Forgot your password?</h4>
                                <p>
                                    If you have forgot your password, you can use the password reset function by pressing the <mark><small>Forgot your password?</small></mark> link. An email will be sent to the registered email with a special link. The link will allow you to set a new password.
                                </p>
                            </div>
                        </div>
                    </div>
                </If>
            </div>
        );
    }
}

export default AuthPageLogin;
