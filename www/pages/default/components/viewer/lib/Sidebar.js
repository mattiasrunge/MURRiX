
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import { Icon, Header, List, Dropdown } from "semantic-ui-react";
import { Comments } from "components/comment";
import { NodeLink } from "components/nodeparts";
import { StringList } from "components/utils";
import format from "lib/format";
import notification from "lib/notification";
import api from "api.io-client";

class Sidebar extends Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: true,
            parent: false,
            versions: [],
            device: false,
            deviceOwners: [],
            versions: [],
            tags: []
        };
    }

    async load() {
        await this.update(this.props);
    }

    componentDidUpdate(prevProps) {
        if (this.props.node !== prevProps.node) {
            this.update(prevProps);
        }
    }

    async update(props) {
        this.setState({ loading: true });

        try {
            const parent = await api.vfs.resolve(`${props.node.path}/../..`, { noerror: true });

            const device = await api.vfs.resolve(`${props.node.path}/createdWith`, { noerror: true });

            const deviceOwners = await api.vfs.list(`${props.node.path}/createdWith/owners`, { noerror: true });

            const versions = await api.vfs.list(`${props.node.path}/versions`, { noerror: true });

            const tags = await api.vfs.list(`${props.node.path}/tags`, { noerror: true });

            !this.disposed && this.setState({
                parent,
                device,
                deviceOwners,
                versions,
                tags,
                loading: false
            });
        } catch (error) {
            this.logError("Failed to load node information", error, 10000);
            !this.disposed && this.setState({
                parent: false,
                device: false,
                deviceOwners: [],
                versions: [],
                tags: [],
                loading: false
            });
        }
    }

    onRotateRight = async () => {
        try {
            await api.vfs.rotate(this.props.node.path, -90);
        } catch (error) {
            this.logError("Failed to rotate right", error);
            notification.add("error", error.message, 10000);
        }
    }

    onRotateLeft = async () => {
        try {
            await api.vfs.rotate(this.props.node.path, 90);
        } catch (error) {
            this.logError("Failed to rotate right", error);
            notification.add("error", error.message, 10000);
        }
    }

    onMirror = async () => {
        try {
            await api.vfs.mirror(this.props.node.path);
        } catch (error) {
            this.logError("Failed to mirror", error);
            notification.add("error", error.message, 10000);
        }
    }

    render() {
        return (
            <div className={this.props.theme.sidebarContainer}>
                <Icon
                    className={this.props.theme.sidebarCloseIcon}
                    link
                    fitted
                    size="large"
                    name="close"
                    onClick={this.props.onClose}
                />

                <If condition={this.props.node.editable}>
                    <Dropdown
                        icon={{
                            name: "setting",
                            size: "large",
                            link: true
                        }}
                        className={this.props.theme.sidebarEditIcon}
                        direction="left"
                    >
                        <Dropdown.Menu>
                            <If condition={this.props.node.attributes.type === "image" || this.props.node.attributes.type === "video" || this.props.node.attributes.type === "document"}>
                                <Dropdown.Item
                                    icon="repeat"
                                    text="Rotate right"
                                    onClick={this.onRotateRight}
                                />
                                <Dropdown.Item
                                    icon="undo"
                                    text="Rotate left"
                                    onClick={this.onRotateLeft}
                                />
                                <Dropdown.Item
                                    icon="exchange"
                                    text="Mirror"
                                    onClick={this.onMirror}
                                />
                            </If>
                        </Dropdown.Menu>
                    </Dropdown>
                </If>

                <Header as="h2">Details</Header>
                <List
                    divided
                    relaxed="very"
                    verticalAlign="middle"
                    className={this.props.theme.sidebarList}
                >
                    <If condition={this.props.node.attributes.description}>
                        <List.Item>
                            <List.Icon size="big" name="file alternate" />
                            <List.Content>
                                {this.props.node.attributes.description}
                            </List.Content>
                        </List.Item>
                    </If>
                    <If condition={this.state.device}>
                        <List.Item>
                            <List.Icon size="big" name="camera retro" />
                            <List.Content>
                                <NodeLink
                                    node={this.state.device}
                                />
                                <If condition={this.state.deviceOwners.length > 0}>
                                    <div className={this.props.theme.sidebarListSecondary}>
                                        {"Owned by "}
                                        <StringList>
                                            <For each="owner" of={this.state.deviceOwners}>
                                                <NodeLink
                                                    key={owner.path}
                                                    node={owner}
                                                />
                                            </For>
                                        </StringList>
                                    </div>
                                </If>
                            </List.Content>
                        </List.Item>
                    </If>
                    <List.Item>
                        <List.Icon size="big" name="download" />
                        <List.Content>
                            <a
                                href={`/media/file/${this.props.node.attributes.diskfilename}/${this.props.node.attributes.name}`}
                            >
                                {this.props.node.attributes.name}
                            </a>
                            {" "}
                            ({format.size(this.props.node.attributes.size)})
                            <If condition={this.state.versions.length > 0}>
                                <List className={this.props.theme.sidebarListSecondary}>
                                    <For each="version" of={this.state.versions}>
                                        <List.Item key={version.path}>
                                            <a
                                                href={`/media/file/${version.attributes.diskfilename}/${version.attributes.name}`}
                                            >
                                                {version.attributes.name}
                                            </a>
                                            {" "}
                                            ({format.size(version.attributes.size)})
                                        </List.Item>
                                    </For>
                                </List>
                            </If>
                        </List.Content>
                    </List.Item>
                    <If condition={this.state.parent}>
                        <List.Item>
                            <List.Icon size="big" name="book" />
                            <List.Content>
                                <NodeLink
                                    node={this.state.parent}
                                />
                            </List.Content>
                        </List.Item>
                    </If>
                    <If condition={this.state.tags.length > 0}>
                        <List.Item>
                            <List.Icon size="big" name="user" />
                            <List.Content>
                                <List className={this.props.theme.sidebarListNested}>
                                    <For each="tag" of={this.state.tags}>
                                        <List.Item key={tag.path}>
                                            <NodeLink
                                                node={tag}
                                            />
                                        </List.Item>
                                    </For>
                                </List>
                            </List.Content>
                        </List.Item>
                    </If>
                    <If condition={this.props.node.attributes.fileinfo.width}>
                        <List.Item>
                            <List.Icon size="big" name="expand" />
                            <List.Content>
                                {this.props.node.attributes.fileinfo.width}
                                x
                                {this.props.node.attributes.fileinfo.height}
                            </List.Content>
                        </List.Item>
                    </If>
                    <If condition={this.props.node.attributes.fileinfo.duration}>
                        <List.Item>
                            <List.Icon size="big" name="clock" />
                            <List.Content>
                                {format.duration(this.props.node.attributes.fileinfo.duration)}
                            </List.Content>
                        </List.Item>
                    </If>
                </List>

                <Header as="h2">Comments</Header>
                <Comments path={this.props.node.path} />
            </div>
        );
    }
}

Sidebar.propTypes = {
    theme: PropTypes.object,
    node: PropTypes.object.isRequired,
    onClose: PropTypes.func.isRequired
};

export default Sidebar;
