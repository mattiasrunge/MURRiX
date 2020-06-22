
import React from "react";
import PropTypes from "prop-types";
import { Header, Message, Button, Grid, Table, List, Dimmer, Loader } from "semantic-ui-react";
import Component from "lib/component";
import notification from "lib/notification";
import { api, event, backend } from "lib/backend";
import format from "lib/format";
import theme from "./theme.module.css";

class Dropbox extends Component {
    constructor(props) {
        super(props);

        this.folder = document.location.host.includes("localhost") ? "/test" : "/Camera Upload";

        this.state = {
            loading: true,
            settings: false
        };
    }

    async load() {
        await this.update(this.props);

        this.addDisposable(event.on("dropbox.auth", (event, result) => {
            if (result.id === this.waitingForId) {
                delete this.waitingForId;

                if (result.success) {
                    this.update(this.props);
                } else {
                    notification.add("error", "Failed to connect", 10000);
                }
            }
        }));
    }

    componentDidUpdate(prevProps) {
        if (prevProps.node !== this.props.node) {
            this.update(this.props);
        }
    }

    async update(props) {
        this.setState({ loading: true });
        try {
            const settings = await api.dropboxsettings();

            this.setState({
                settings,
                loading: false
            });
        } catch (error) {
            this.logError("Failed to get dropbox settings", error);
            notification.add("error", error.message, 10000);
            this.setState({
                settings: false,
                loading: false
            });
        }
    }

    onConnect = async () => {
        const { url, id } = await api.dropboxconnect(backend.url, this.folder);

        this.waitingForId = id;

        const tab = window.open(url, "_blank");
        tab.focus();
    }

    onDisconnect = async () => {
        try {
            await api.dropboxdisconnect();

            this.update(this.props);
        } catch (error) {
            this.logError("Failed to disconnect from dropbox", error);
            notification.add("error", error.message, 10000);
        }
    }

    render() {
        return (
            <div>
                <Header as="h2">
                    Dropbox
                    <Header.Subheader>
                        Setup automatic staging of files from Dropbox
                    </Header.Subheader>
                </Header>
                <Grid>
                    <Grid.Row>
                        <Grid.Column width={8}>
                            <Choose>
                                <When condition={this.state.loading}>
                                    <Dimmer active inverted>
                                        <Loader inverted>Loading...</Loader>
                                    </Dimmer>
                                </When>
                                <When condition={this.state.settings}>
                                    <Table definition>
                                        <Table.Body>
                                            <Table.Row>
                                                <Table.Cell>Account Name</Table.Cell>
                                                <Table.Cell>
                                                    {this.state.settings.account.name.display_name}
                                                </Table.Cell>
                                            </Table.Row>
                                            <Table.Row>
                                                <Table.Cell>Account E-mail</Table.Cell>
                                                <Table.Cell>
                                                    <a
                                                        href={`mailto:${this.state.settings.account.email}`}
                                                        target="_blank"
                                                    >
                                                        {this.state.settings.account.email}
                                                    </a>
                                                </Table.Cell>
                                            </Table.Row>
                                            <Table.Row>
                                                <Table.Cell>Link</Table.Cell>
                                                <Table.Cell>
                                                    <a
                                                        href="https://www.dropbox.com"
                                                        target="_blank"
                                                    >
                                                        Goto Dropbox
                                                    </a>
                                                </Table.Cell>
                                            </Table.Row>
                                            <Table.Row>
                                                <Table.Cell>Folder</Table.Cell>
                                                <Table.Cell>
                                                    {this.state.settings.folder}
                                                </Table.Cell>
                                            </Table.Row>
                                            <Table.Row>
                                                <Table.Cell>Space</Table.Cell>
                                                <Table.Cell>
                                                    {format.size(this.state.settings.space.used, 2)} of {format.size(this.state.settings.space.allocation.allocated, 2)} used
                                                </Table.Cell>
                                            </Table.Row>
                                        </Table.Body>
                                    </Table>

                                    <Button
                                        color="red"
                                        size="medium"
                                        fluid
                                        icon="dropbox"
                                        content="Disconnect"
                                        onClick={this.onDisconnect}
                                    />
                                </When>
                                <Otherwise>
                                    <Message negative>
                                        <Message.Header>Please note!</Message.Header>
                                        <p>
                                            Any staged files will be <strong>removed</strong> from Dropbox.
                                        </p>
                                    </Message>
                                    <Button
                                        primary
                                        size="large"
                                        fluid
                                        icon="dropbox"
                                        content="Connect"
                                        onClick={this.onConnect}
                                    />
                                </Otherwise>
                            </Choose>
                        </Grid.Column>
                        <Grid.Column width={8}>
                            <Message>
                                <Message.Header>Set it up</Message.Header>
                                <List ordered>
                                    <List.Item>
                                        Install the <a href="https://play.google.com/store/apps/details?id=com.dropbox.android" target="_blank">Dropbox app</a>
                                    </List.Item>
                                    <List.Item>
                                        Enable <i>Camera Uploads</i> in the app
                                    </List.Item>
                                    <List.Item>
                                        Press the <strong>Connect</strong> button here on the left
                                    </List.Item>
                                    <List.Item>
                                        Follow the instructions to connect to Dropbox
                                    </List.Item>
                                    <List.Item>
                                        Now all camera uploads will periodically be staged and removed from dropbox
                                    </List.Item>
                                </List>
                            </Message>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </div>
        );
    }
}

Dropbox.propTypes = {
    node: PropTypes.object.isRequired
};

export default Dropbox;
