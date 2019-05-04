
/* global document */

import React from "react";
import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";
import api from "api.io-client";
import Component from "lib/component";
import { Input, Modal, Button, Form, Message } from "semantic-ui-react";
import { Focus } from "components/utils";

class RequestReset extends Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            error: false,
            username: props.match.params.username || "",
            sent: false
        };
    }

    async reset() {
        if (!this.state.username) {
            return;
        }

        const templateUrl = `${document.location.origin}/reset/${this.state.username}/$ID`;

        this.setState({ loading: true, error: false });

        try {
            await api.vfs.passwdrequest(this.state.username, templateUrl);
            this.setState({ loading: false, sent: true });
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
                <Modal.Header>Request password reset</Modal.Header>
                <Modal.Content>
                    <Choose>
                        <When condition={this.state.sent}>
                            <Message
                                success
                                header="Password reset was successfull"
                                content="Please use the link set to you by e-mail"
                            />
                        </When>
                        <Otherwise>
                            <Form>
                                <Form.Field>
                                    <label>E-Mail</label>
                                    <Focus select>
                                        <Input
                                            name="username"
                                            value={this.state.username}
                                            onChange={(e, { value }) => this.setState({ username: value })}
                                            onKeyDown={(e) => e.which === 13 && this.reset()}
                                        />
                                    </Focus>
                                </Form.Field>
                                <Button
                                    primary
                                    loading={this.state.loading}
                                    disabled={!this.state.username}
                                    content="Reset password"
                                    onClick={() => this.reset()}
                                />
                                <If condition={this.state.error}>
                                    <span className={this.props.theme.errorMessage}>
                                        {this.state.error}
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

RequestReset.propTypes = {
    theme: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired
};

export default withRouter(RequestReset);
