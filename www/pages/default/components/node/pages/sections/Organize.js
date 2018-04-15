
import React from "react";
import PropTypes from "prop-types";
import store from "store";
import Component from "lib/component";
import api from "api.io-client";
import notification from "lib/notification";
import { Header, Grid, Icon, Button, List } from "semantic-ui-react";
import { NodeImage, NodeInput } from "components/nodeparts";
import { SelectableImageList } from "components/list";

class Organize extends Component {
    constructor(props) {
        super(props);

        this.state = {
            selected: [],
            loading: false,
            remotes: store.get("organize_remotes") || []
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
            const selected = this.state.selected.slice(0);

            for (const file of selected) {
                await api.vfs.move(file.path, `${remote.path}/files`);
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
        this.context.router.history.push(`/node${remote.path}`);
    }

    onSelectedChange = (selected) => {
        this.setState({ selected });
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
                            <SelectableImageList
                                path={`${this.props.node.path}/files`}
                                value={this.state.selected}
                                onChange={this.onSelectedChange}
                            />
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
                                size="mini"
                            />

                            <List divided verticalAlign="middle">
                                <For each="remote" of={this.state.remotes}>
                                    <If condition={remote.path !== this.props.node.path}>
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
                                    </If>
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
    match: PropTypes.object.isRequired
};

Organize.contextTypes = {
    router: PropTypes.object.isRequired
};

export default Organize;
