
import api from "api.io-client";
import ui from "lib/ui";
import loc from "lib/location";
import stat from "lib/status";
import React from "react";
import Component from "lib/component";
import { Button, Form, FormGroup, Label, Input, Col } from "reactstrap";

class AuthPageReset extends Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            password1: "",
            password2: "",
            username: loc.get("email"),
            id: loc.get("id")
        };
    }

    componentDidMount() {
        this.addDisposables([
            loc.subscribe((params) => {
                this.setState({
                    username: params.email,
                    id: params.id
                });
            })
        ]);

        ui.setTitle("Password reset");
    }

    async changePassword(event) {
        event.preventDefault();

        if (this.state.password1 !== this.state.password2) {
            return stat.printError("Password does not match!");
        } else if (this.state.password1 === "") {
            return stat.printError("Password can not be empty!");
        }

        this.setState({ loading: true });

        try {
            await api.auth.passwordReset(this.state.username, this.state.id, this.state.password1);

            stat.printSuccess("Password reset successfully!");
            this.setState({ loading: false, password1: "", password2: "" });
            loc.goto({ page: "login", email: null, id: null });
        } catch (e) {
            console.error(e);
            stat.printError("Failed to reset password");
            this.setState({ loading: false });
        }
    }

    render() {
        return (
            <div className="fadeInRight animated">
                <div className="page-header">
                    <h1>Reset password for <span data-bind="text: username"></span></h1>
                </div>
                <div className="row">
                    <div className="col-md-6">
                        <Form autoComplete="off">
                            <FormGroup row={true}>
                                <Label for="password1" sm={3}>Password</Label>
                                <Col sm={9}>
                                    <Input
                                        type="password"
                                        name="password1"
                                        id="password1"
                                        placeholder="New password"
                                        disabled={this.state.loading}
                                        value={this.state.password1}
                                        onChange={(e) => this.setState({ password1: e.target.value })}
                                    />
                                </Col>
                            </FormGroup>
                            <FormGroup row={true}>
                                <Col sm={{ size: 9, offset: 3 }}>
                                    <Input
                                        type="password"
                                        name="password2"
                                        id="password2"
                                        placeholder="Confirm new password"
                                        disabled={this.state.loading}
                                        value={this.state.password2}
                                        onChange={(e) => this.setState({ password2: e.target.value })}
                                    />
                                </Col>
                            </FormGroup>
                            <FormGroup row={true}>
                                <Col sm={{ size: 9, offset: 3 }}>
                                    <Button
                                        color="primary"
                                        onClick={(e) => this.changePassword(e)}
                                    >
                                        Change password
                                    </Button>
                                </Col>
                            </FormGroup>
                        </Form>
                    </div>
                    <div className="col-md-6">
                        <div className="box box-content" style={{ marginTop: 0 }}>
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
