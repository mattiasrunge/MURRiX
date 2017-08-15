
import api from "api.io-client";
import session from "lib/session";
import loc from "lib/location";
import stat from "lib/status";
import React from "react";
import { Button, Form, FormGroup, Label, Input, Col } from "reactstrap";
import NodeWidgetNodeSelect from "plugins/node/components/widget-node-select";
import PropTypes from "prop-types";
import Component from "lib/component";

class AuthWidgetEditUser extends Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            name: this.props.user.attributes.name,
            username: this.props.username,
            personPath: this.props.personPath || null,
            password1: "",
            password2: ""
        };
    }

    componentDidMount() {
        this.reset();
    }

    reset() {
        this.setState({
            loading: false,
            name: this.props.user.attributes.name,
            username: this.props.username,
            personPath: this.props.personPath || null,
            password1: "",
            password2: ""
        });
    }

    async save(event) {
        event.preventDefault();

        if (this.state.username === "") {
            return stat.printError("Username can not be empty!");
        }

        this.setState({ loading: true });

        try {
            await api.auth.saveProfile(this.state.username, {
                name: this.state.name
            }, this.state.personPath);

            if (this.props.username !== this.state.username) {
                await api.auth.changeUsername(this.props.username, this.state.username);

                if (this.state.username === session.username()) {
                    stat.printInfo("After username change you must login again");
                    await api.auth.logout();
                    await session.loadUser();
                    loc.goto({ page: "login" });
                } else if (this.state.username === session.username()) {
                    await session.loadUser();
                }
            } else if (this.state.username === session.username()) {
                await session.loadUser();
            }

            stat.printSuccess("Profile saved successfully!");
            this.reset();
        } catch (e) {
            console.error(e);
            stat.printError("Failed to save user");
            this.setState({ loading: false });
        }
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
            await api.auth.passwd(this.props.username, this.state.password1);

            stat.printSuccess("Password changed successfully!");
            this.reset();
        } catch (e) {
            console.error(e);
            stat.printError("Failed to change password");
            this.setState({ loading: false });
        }
    }

    render() {
        return (
            <div>
                <div>
                    <Form>
                        <FormGroup row={true}>
                            <Label for="name" sm={3}>Name</Label>
                            <Col sm={9}>
                                <Input
                                    type="text"
                                    name="name"
                                    id="name"
                                    placeholder="New password"
                                    disabled={this.state.loading}
                                    value={this.state.name}
                                    onChange={(e) => this.setState({ name: e.target.value })}
                                />
                            </Col>
                        </FormGroup>
                        <FormGroup row={true}>
                            <Label for="name" sm={3}>E-Mail</Label>
                            <Col sm={9}>
                                <Input
                                    type="text"
                                    name="username"
                                    id="username"
                                    placeholder="E-mail"
                                    disabled={this.state.loading}
                                    value={this.state.username}
                                    onChange={(e) => this.setState({ username: e.target.value })}
                                />
                            </Col>
                        </FormGroup>
                        <FormGroup row={true}>
                            <Label for="name" sm={3}>Person</Label>
                            <Col sm={9}>
                                <NodeWidgetNodeSelect
                                    root={[ "/people" ]}
                                    path={this.state.personPath}
                                    placeholder="Person"
                                    onSelect={(node) => this.setState({ personPath: node ? node.path : null })}
                                />
                            </Col>
                        </FormGroup>
                        <FormGroup row={true}>
                            <Col sm={{ size: 9, offset: 3 }}>
                                <Button
                                    color="primary"
                                    onClick={(e) => this.save(e)}
                                >
                                    Save
                                </Button>
                                <Button
                                    color="secondary"
                                    onClick={(e) => this.reset(e)}
                                >
                                    Reset
                                </Button>
                            </Col>
                        </FormGroup>
                    </Form>
                </div>


                <div className="top-border" style={{ paddingTop: "15px" }}>
                    <Form>
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
            </div>
        );
    }
}

AuthWidgetEditUser.propTypes = {
    user: PropTypes.object.isRequired,
    username: PropTypes.string.isRequired,
    personPath: PropTypes.any.isRequired
};

export default AuthWidgetEditUser;
