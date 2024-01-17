
import React from "react";
import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";
import { Input, Modal, Button, Form, Message } from "semantic-ui-react";
import { api } from "lib/backend";
import Component from "lib/component";
import { Focus } from "components/utils";
import theme from "./theme.module.css";

class ResetPassword extends Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            error: false,
            password1: "",
            password2: "",
            set: false
        };
    }

    signIn() {
        this.props.history.push("/");
    }

    async set() {
        if (!this.state.password1 || this.state.password1 !== this.state.password2) {
            return;
        }

        this.setState({ loading: true, error: false });

        try {
            await api.passwdreset(this.props.match.params.username, this.props.match.params.id, this.state.password1);
            this.setState({ loading: false, set: true });
        } catch (error) {
            this.logError("Failed to reset password", error);
            this.setState({ loading: false, error: "Failed to reset password" });
        }
    }

    render() {
        return (
            <Modal
                open
                style={{ marginTop: 0 }}
                size="tiny"
            >
                <Modal.Header>Reset password</Modal.Header>
                <Modal.Content>
                    <Choose>
                        <When condition={this.state.set}>
                            <Message
                                success
                                header="Password was set successfully"
                            />
                            <Button
                                primary
                                content="Sign in"
                                onClick={() => this.signIn()}
                            />
                        </When>
                        <Otherwise>
                            <Form>
                                <Form.Field>
                                    <label>New Password</label>
                                    <Focus>
                                        <Input
                                            name="password1"
                                            type="password"
                                            autoComplete="off"
                                            value={this.state.password1}
                                            onChange={(e, { value }) => this.setState({ password1: value })}
                                            onKeyDown={(e) => e.which === 13 && this.reset()}
                                        />
                                    </Focus>
                                </Form.Field>
                                <Form.Field>
                                    <label>Confirm New Password</label>
                                    <Input
                                        name="password2"
                                        type="password"
                                        autoComplete="off"
                                        value={this.state.password2}
                                        onChange={(e, { value }) => this.setState({ password2: value })}
                                        onKeyDown={(e) => e.which === 13 && this.reset()}
                                    />
                                </Form.Field>
                                <Button
                                    primary
                                    loading={this.state.loading}
                                    disabled={!this.state.password1 || this.state.password1 !== this.state.password2}
                                    content="Set new password"
                                    onClick={() => this.set()}
                                />
                                <If condition={this.state.error}>
                                    <span className={theme.errorMessage}>
                                        {this.state.error}
                                    </span>
                                </If>
                                <If condition={this.state.password2 && this.state.password1 !== this.state.password2}>
                                    <span className={theme.errorMessage}>
                                        Password do not match
                                    </span>
                                </If>
                            </Form>
                        </Otherwise>
                    </Choose>
                </Modal.Content>
            </Modal>
        );
    }
}

ResetPassword.propTypes = {
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired
};

export default withRouter(ResetPassword);
