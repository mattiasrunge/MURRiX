
import React from "react";
import PropTypes from "prop-types";
import store from "store";
import Component from "lib/component";
import api from "api.io-client";
import notification from "lib/notification";
import { Header, Grid, Loader, Icon, Image, Button, List } from "semantic-ui-react";
import { NodeImage, NodeInput } from "components/nodeparts";

class Organize extends Component {
    constructor(props) {
        super(props);

        this.state = {
            files: [],
            selected: [],
            loading: false,
            remotes: store.get("organize_remotes") || []
        };
    }
    async load() {
        this.setState({ loading: true, selected: [] });

        try {
            const files = await api.vfs.list(`${this.props.node.path}/files`, { noerror: true });

            this.setState({
                files,
                loading: false
            });
        } catch (error) {
            this.logError("Failed to load files", error);
            notification.add("error", error.message, 10000);
            this.setState({
                files: [],
                loading: false
            });
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.node !== this.props.node) {
            this.load();
        }
    }

    onClick(file) {
        if (this.state.loading) {
            return;
        }

        if (this.state.selected.includes(file)) {
            this.setState({
                selected: this.state.selected.filter((f) => f !== file)
            });
        } else {
            this.setState({
                selected: this.state.selected.slice(0).concat(file)
            });
        }
    }

    onSelectAll = () => {
        this.setState({
            selected: this.state.files
        });
    }

    onSelectNone = () => {
        this.setState({
            selected: []
        });
    }

    onRemote = (remote) => {
        const remotes = this.state.remotes.filter((r) => r._id !== remote._id).concat(remote);

        store.set("organize_remotes", remotes);
        this.setState({ remotes });
    }

    onRemoveRemote(e, remote) {
        e.stopPropagation();

        const remotes = this.state.remotes.filter((r) => r._id !== remote._id);

        store.set("organize_remotes", remotes);
        this.setState({ remotes });
    }

    async onMoveToRemote(e, remote) {
        e.stopPropagation();

        this.setState({ loading: true });

        try {
            for (const file of this.state.selected) {
                await api.vfs.move(file.path, `${remote.path}/files`);
            }

            notification.add("success", `Moved ${this.state.selected.length} file(s) successfully`);

            this.setState({ loading: false, selected: [] });

            await this.load();
        } catch (error) {
            this.logError("Failed to move files", error);
            notification.add("error", error.message, 10000);

            this.setState({ loading: false });
        }
    }

    onClickRemote(remote) {
        this.context.router.history.push(`/node${remote.path}`);
    }

    render() {
        return (
            <div>
                <Header as="h2">
                    Organize
                    <Header.Subheader>
                        Move files to another album
                    </Header.Subheader>
                </Header>
                <Grid>
                    <Grid.Row>
                        <Grid.Column width={8}>
                            <Loader
                                active={this.state.loading}
                                className={this.props.theme.mediaLoader}
                                content="Loading files..."
                                inline="centered"
                            />
                            <Button.Group
                                size="mini"
                                floated="right"
                                style={{
                                    marginBottom: 10
                                }}
                            >
                                <Button
                                    content="Select none"
                                    disabled={this.state.selected.length === 0 || this.state.loading}
                                    basic
                                    onClick={this.onSelectNone}
                                />
                                <Button
                                    content="Select all"
                                    disabled={this.state.selected.length === this.state.files.length || this.state.loading}
                                    basic
                                    onClick={this.onSelectAll}
                                />
                            </Button.Group>
                            <Image.Group className={this.props.theme.mediaImageContainer}>
                                <For each="file" of={this.state.files}>
                                    <span
                                        key={file._id}
                                        className={this.props.theme.mediaImageSelectable}
                                        onClick={() => this.onClick(file)}
                                    >
                                        <NodeImage
                                            className={this.props.theme.mediaImage}
                                            title={this.props.node.attributes.name}
                                            path={file.path}
                                            format={{
                                                width: 50,
                                                height: 50,
                                                type: "image"
                                            }}
                                            lazy
                                        />
                                        <If condition={this.state.selected.includes(file)}>
                                            <div className={this.props.theme.mediaImageSelected}>
                                                <Icon name="check" />
                                            </div>
                                        </If>
                                    </span>
                                </For>
                            </Image.Group>
                        </Grid.Column>
                        <Grid.Column width={8}>
                            <NodeInput
                                className={this.props.theme.organizeRemoteInput}
                                value={null}
                                onChange={this.onRemote}
                                paths={[
                                    "/albums"
                                ]}
                                icon="book"
                                loading={this.state.loading}
                                placeholder="Add album to list..."
                            />

                            <List divided verticalAlign="middle">
                                <For each="remote" of={this.state.remotes}>
                                    <List.Item
                                        key={remote._id}
                                        className={this.props.theme.organizeRemoteListItem}
                                        onClick={() => this.onClickRemote(remote)}
                                    >
                                        <List.Content className={this.props.theme.organizeRemoteListItemContent}>
                                            <Icon
                                                className={this.props.theme.organizeRemoteListItemClose}
                                                name="close"
                                                title="Remove from list"
                                                link
                                                onClick={(e) => this.onRemoveRemote(e, remote)}
                                            />
                                            <Button
                                                primary
                                                size="mini"
                                                icon="arrow right"
                                                floated="left"
                                                title="Move selected files to this album"
                                                disabled={this.state.selected.length === 0 || this.state.loading}
                                                onClick={(e) => this.onMoveToRemote(e, remote)}
                                            />
                                            <NodeImage
                                                path={`${remote.path}/profilePicture`}
                                                format={{
                                                    width: 28,
                                                    height: 28,
                                                    type: "image"
                                                }}
                                                rounded
                                                floated="left"
                                            />
                                            {remote.attributes.name}
                                        </List.Content>

                                    </List.Item>
                                </For>
                            </List>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </div>
        );
    }
}

Organize.propTypes = {
    theme: PropTypes.object,
    node: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired,
    editAllowed: PropTypes.bool
};

Organize.contextTypes = {
    router: PropTypes.object.isRequired
};

export default Organize;
