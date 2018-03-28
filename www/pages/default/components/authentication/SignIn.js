
import React from "react";
import PropTypes from "prop-types";
import api from "api.io-client";
import session from "lib/session";
import Component from "lib/component";
import { Input, Modal, Button, Form } from "semantic-ui-react";
import { Focus } from "components/utils";

class SignIn extends Component {
    constructor(props) {
        super(props);

        this.state = {
            user: session.user(),
            loading: false,
            error: false,
            username: "",
            password: ""
        };
    }

    async load() {
        this.addDisposable(session.on("update", (event, user) => this.setState({ user })));
    }

    resetPassword() {
        this.context.router.history.push(`/reset/${this.state.username}`);
    }

    async signIn() {
        if (!this.state.username || !this.state.password) {
            return;
        }

        this.setState({ loading: true, error: false });

        try {
            await api.vfs.login(this.state.username, this.state.password);
            this.setState({ loading: false });
        } catch (error) {
            this.logError("Failed to login", error);
            this.setState({ loading: false, error: "Failed to login" });
        }
    }

    render() {
        return (
            <Modal
                open
                style={{ marginTop: 0 }}
                size="tiny"
            >
                <Modal.Header>Authentication required</Modal.Header>
                <Modal.Content>
                    <Form>
                        <Form.Field>
                            <label>E-Mail</label>
                            <Focus>
                                <Input
                                    name="username"
                                    value={this.state.username}
                                    onChange={(e, { value }) => this.setState({ username: value })}
                                    onKeyDown={(e) => e.which === 13 && this.signIn()}
                                />
                            </Focus>
                        </Form.Field>
                        <Form.Field>
                            <label>
                                Password
                                <a
                                    className={this.props.theme.resetPasswordLink}
                                    onClick={() => this.resetPassword()}
                                >
                                    Forgot password?
                                </a>
                            </label>
                            <Input
                                name="password"
                                type="password"
                                value={this.state.password}
                                onChange={(e, { value }) => this.setState({ password: value })}
                                onKeyDown={(e) => e.which === 13 && this.signIn()}
                            />
                        </Form.Field>
                        <Button
                            primary
                            loading={this.state.loading}
                            disabled={!this.state.username || !this.state.password}
                            icon="sign in"
                            content="Sign in"
                            onClick={() => this.signIn()}
                        />
                        <If condition={this.state.error}>
                            <span className={this.props.theme.errorMessage}>
                                {this.state.error}
                            </span>
                        </If>
                    </Form>
                </Modal.Content>
            </Modal>
        );
    }
}

SignIn.propTypes = {
    theme: PropTypes.object
};

SignIn.contextTypes = {
    router: PropTypes.object.isRequired
};

export default SignIn;
