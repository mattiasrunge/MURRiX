
import React from "react";
import PropTypes from "prop-types";
import store from "store";
import { withRouter } from "react-router-dom";
import { Icon, Button, List, Divider, Modal, Message, Grid } from "semantic-ui-react";
import Component from "lib/component";
import { api } from "lib/backend";
import notification from "lib/notification";
import { NodeImage, NodeInput } from "components/nodeparts";
import { CreateModal } from "components/edit";
import theme from "../../theme.module.css";

class MoveToList extends Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            deleteConfirm: false,
            remotes: store.get("organize_remotes") || [],
            create: null
        };
    }

    onRemote = (remote) => {
        const remotes = this.state.remotes.filter((r) => r._id !== remote._id).concat(remote);

        store.set("organize_remotes", remotes);
        this.setState({ remotes });

        return false;
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
            const selected = this.props.files.slice(0);

            for (const file of selected) {
                await api.move(file.path, `${remote.path}/files`, { inherit: true });
            }

            notification.add("success", `Moved ${selected.length} file(s) successfully`);

            this.setState({ loading: false, selected: [] });

            await this.load();
        } catch (error) {
            this.logError("Failed to move files", error);
            notification.add("error", error.message, 10000);

            this.setState({ loading: false });
        }
    }

    onClickRemote(remote) {
        this.props.history.push(`/node${remote.path}`);
    }

    onDeleteRequest = () => {
        this.setState({ deleteConfirm: true });
    }

    onDeleteCancel = () => {
        this.setState({ deleteConfirm: false });
    }

    onDelete = async () => {
        this.setState({ deleteConfirm: false, loading: true });

        try {
            const selected = this.props.files.slice(0);

            for (const file of selected) {
                await api.unlink(file.path);
            }

            notification.add("success", `Deleted ${selected.length} file(s) successfully`);

            this.setState({ loading: false, selected: [] });

            await this.load();
        } catch (error) {
            this.logError("Failed to delete files", error);
            notification.add("error", error.message, 10000);

            this.setState({ loading: false });
        }
    }

    onCreateRequest = () => {
        this.setState({
            create: { type: "a", path: "/albums" } });
    }

    onCreateClose = (remote) => {
        this.setState({ create: null });

        remote && this.onRemote(remote);
    }

    render() {
        return (
            <div>
                <If condition={this.state.deleteConfirm}>
                    <Modal
                        size="mini"
                        defaultOpen
                        onClose={this.onDeleteCancel}
                    >
                        <Modal.Header>
                            Delete confirmaation
                        </Modal.Header>
                        <Modal.Content>
                            <p>
                                Are you sure you want to delete {this.props.files.length} file(s)?
                            </p>
                            <Message negative>
                                <p>
                                    <strong>This action can not be reversed!</strong>
                                </p>
                            </Message>
                        </Modal.Content>
                        <Modal.Actions>
                            <Button
                                primary
                                onClick={this.onDeleteCancel}
                                content="No"
                            />
                            <Button
                                negative
                                icon="checkmark"
                                content="Delete"
                                onClick={this.onDelete}
                            />
                        </Modal.Actions>
                    </Modal>
                </If>

                <If condition={this.state.create}>
                    <CreateModal
                        type={this.state.create.type}
                        path={this.state.create.path}
                        onClose={this.onCreateClose}
                        gotoNew={false}
                    />
                </If>

                <Grid>
                    <Grid.Row>
                        <Grid.Column width={2}>
                            <Button
                                disabled={this.state.loading}
                                className={theme.organizeCreateAlbum}
                                primary
                                icon="add"
                                size="mini"
                                onClick={this.onCreateRequest}
                            />
                        </Grid.Column>
                        <Grid.Column width={14}>
                            <NodeInput
                                className={theme.organizeRemoteInput}
                                value={null}
                                onChange={this.onRemote}
                                paths={[
                                    "/albums"
                                ]}
                                icon="book"
                                loading={this.state.loading}
                                placeholder="Add album to list..."
                                size="mini"
                            />
                        </Grid.Column>
                    </Grid.Row>
                </Grid>

                <List divided verticalAlign="middle">
                    <For each="remote" of={this.state.remotes}>
                        <If condition={remote.path !== this.props.node.path}>
                            <List.Item
                                key={remote._id}
                                className={theme.organizeRemoteListItem}
                                onClick={() => this.onClickRemote(remote)}
                            >
                                <List.Content className={theme.organizeRemoteListItemContent}>
                                    <Icon
                                        className={theme.organizeRemoteListItemClose}
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
                                        disabled={this.props.files.length === 0 || this.state.loading}
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
                        </If>
                    </For>
                </List>

                <Divider />

                <Button
                    disabled={this.state.loading || this.props.files.length === 0}
                    className={theme.organizeRemoteDelete}
                    color="red"
                    icon="delete"
                    content="Delete selected"
                    fluid
                    size="small"
                    onClick={this.onDeleteRequest}
                />
            </div>
        );
    }
}

MoveToList.propTypes = {
    node: PropTypes.object.isRequired,
    files: PropTypes.array.isRequired,
    history: PropTypes.object.isRequired
};

export default withRouter(MoveToList);
