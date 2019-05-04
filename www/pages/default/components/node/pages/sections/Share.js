
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import api from "api.io-client";
import notification from "lib/notification";
import { Header, Grid, Table, Label, Checkbox } from "semantic-ui-react";
import { NodeImage } from "components/nodeparts";

class Share extends Component {
    constructor(props) {
        super(props);

        this.state = {
            groups: [],
            users: [],
            loading: false,
            saving: false,
            showInactive: false
        };
    }

    async createUserList(groups) {
        const users = await api.vfs.users();

        const owner = users.find((user) => user.attributes.uid === this.props.node.properties.uid);

        const list = [
            {
                id: owner._id,
                name: owner.attributes.name,
                node: owner,
                readable: !!(this.props.node.properties.mode & api.vfs.MASK_USER_READ),
                writable: !!(this.props.node.properties.mode & api.vfs.MASK_USER_WRITE),
                owner: true
            }
        ];

        for (const group of groups) {
            if (group.readable || group.readable) {
                for (const user of group.users) {
                    const current = list.find((data) => data.id === user._id);

                    if (!current || !current.writable) {
                        if (current) {
                            current.writable = true;
                            current.group = group;
                        } else {
                            list.push({
                                id: user._id,
                                name: user.attributes.name,
                                node: user,
                                group,
                                readable: group.readable,
                                writable: group.writable
                            });
                        }
                    }
                }
            }
        }

        list.sort((a) => a.writable ? -1 : 1);

        return list;
    }

    getGroupAccess(group) {
        if (group.attributes.gid === this.props.node.properties.gid) {
            return {
                primary: true,
                readable: !!(this.props.node.properties.mode & api.vfs.MASK_GROUP_READ),
                writable: !!(this.props.node.properties.mode & api.vfs.MASK_GROUP_WRITE)
            };
        }

        const ac = this.props.node.properties.acl.find((ac) => ac.gid === group.attributes.gid);

        if (ac) {
            return {
                ac,
                readable: !!(ac.mode & api.vfs.MASK_ACL_READ),
                writable: !!(ac.mode & api.vfs.MASK_ACL_WRITE)
            };
        }

        return {};
    }

    async createGroupList(groups) {
        return Promise.all(groups.map(async (group) => {
            const access = this.getGroupAccess(group);
            const users = await api.vfs.users(group.name);

            return {
                id: group._id,
                name: group.attributes.name,
                description: group.attributes.description,
                node: group,
                users,
                onReadableClick: (e, { checked }) => this.updateGroupAccess(group, access, checked, checked ? access.writable : false),
                onWritableClick: (e, { checked }) => this.updateGroupAccess(group, access, checked ? true : access.readable, checked),
                ...access
            };
        }));
    }

    async updateGroupAccess(group, access, readable, writable) {
        this.setState({ saving: true });

        try {
            if (access.primary) {
                const currentMode = this.props.node.properties.mode;
                let mode = 0;

                mode |= currentMode & api.vfs.MASK_OWNER_READ ? api.vfs.MASK_OWNER_READ : 0;
                mode |= currentMode & api.vfs.MASK_OWNER_WRITE ? api.vfs.MASK_OWNER_WRITE : 0;
                mode |= currentMode & api.vfs.MASK_OWNER_EXEC ? api.vfs.MASK_OWNER_EXEC : 0;

                mode |= readable || writable ? api.vfs.MASK_GROUP_READ : 0;
                mode |= writable ? api.vfs.MASK_GROUP_WRITE : 0;
                mode |= readable || writable ? api.vfs.MASK_GROUP_EXEC : 0;

                mode |= currentMode & api.vfs.MASK_OTHER_READ ? api.vfs.MASK_OTHER_READ : 0;
                mode |= currentMode & api.vfs.MASK_OTHER_WRITE ? api.vfs.MASK_OTHER_WRITE : 0;
                mode |= currentMode & api.vfs.MASK_OTHER_EXEC ? api.vfs.MASK_OTHER_EXEC : 0;

                if (mode !== currentMode) {
                    await api.vfs.chmod(this.props.node.path, mode, { recursive: true });
                }
            } else {
                const currentMode = access.ac ? access.ac.mode : 0;
                let mode = 0;

                mode |= readable || writable ? api.vfs.MASK_ACL_READ : 0;
                mode |= writable ? api.vfs.MASK_ACL_WRITE : 0;
                mode |= readable || writable ? api.vfs.MASK_ACL_EXEC : 0;

                if (mode !== currentMode) {
                    await api.vfs.setfacl(this.props.node.path, {
                        uid: null,
                        gid: group.attributes.gid,
                        mode
                    }, { recursive: true });
                }
            }
        } catch (error) {
            this.logError("Failed to save mode", error);
            notification.add("error", error.message, 10000);
        }

        !this.disposed && this.setState({ saving: false });
    }

    async load() {
        this.setState({ loading: true });

        try {
            const groupNodes = await api.vfs.groups();
            const groups = await this.createGroupList(groupNodes);

            this.setState({
                groups,
                users: await this.createUserList(groups),
                loading: false
            });
        } catch (error) {
            this.logError("Failed to load groups", error);
            notification.add("error", error.message, 10000);
            this.setState({ groups: [], users: [], loading: false });
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps.node !== this.props.node) {
            this.load();
        }
    }

    onChangeInactiveUsers = (e, { checked }) => {
        this.setState({ showInactive: checked });
    }

    render() {
        const users = this.state.users.filter((user) => this.state.showInactive || !user.node.attributes.inactive);

        return (
            <div>
                <Header as="h2">
                    <Checkbox
                        className={this.props.theme.shareUsersToggle}
                        label="Show inactive users"
                        checked={this.state.showInactive}
                        onChange={this.onChangeInactiveUsers}
                    />
                    Share settings
                    <Header.Subheader>
                        Set who has what access
                    </Header.Subheader>
                </Header>
                <Grid>
                    <Grid.Row>
                        <Grid.Column width={8}>
                            <Table size="small" compact definition>
                                <Table.Header fullWidth>
                                    <Table.Row>
                                        <Table.HeaderCell
                                            className={this.props.theme.editTableHeader}
                                        >
                                            Group
                                        </Table.HeaderCell>
                                        <Table.HeaderCell
                                            className={this.props.theme.editTableHeader}
                                            collapsing
                                            textAlign="center"
                                            verticalAlign="middle"
                                        >
                                            Read
                                        </Table.HeaderCell>
                                        <Table.HeaderCell
                                            className={this.props.theme.editTableHeader}
                                            collapsing
                                            textAlign="center"
                                            verticalAlign="middle"
                                        >
                                            Write
                                        </Table.HeaderCell>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    <For each="group" of={this.state.groups}>
                                        <Table.Row key={group.id}>
                                            <Table.Cell>
                                                <If condition={group.primary}>
                                                    <Label
                                                        style={{ float: "right" }}
                                                        color="violet"
                                                        size="mini"
                                                        content="Primary"
                                                    />
                                                </If>
                                                <div>
                                                    {group.name}
                                                </div>
                                                <small>
                                                    {group.description}
                                                </small>
                                                <div>
                                                    <For each="user" of={group.users.filter((user) => this.state.showInactive || !user.attributes.inactive)}>
                                                        <NodeImage
                                                            key={user._id}
                                                            className={this.props.theme.groupUserAvatar}
                                                            path={`${user.path}/person/profilePicture`}
                                                            title={user.attributes.name}
                                                            format={{
                                                                width: 35,
                                                                height: 35,
                                                                type: "image"
                                                            }}
                                                            avatar
                                                            spaced="right"
                                                            type="u"
                                                            size="small"
                                                        />
                                                    </For>
                                                </div>
                                            </Table.Cell>
                                            <Table.Cell collapsing textAlign="center" verticalAlign="middle">
                                                <Checkbox
                                                    disabled={this.state.saving}
                                                    checked={group.readable}
                                                    onClick={group.onReadableClick}
                                                />
                                            </Table.Cell>
                                            <Table.Cell collapsing textAlign="center" verticalAlign="middle">
                                                <Checkbox
                                                    disabled={this.state.saving}
                                                    checked={group.writable}
                                                    onClick={group.onWritableClick}
                                                />
                                            </Table.Cell>
                                        </Table.Row>
                                    </For>
                                </Table.Body>
                            </Table>
                        </Grid.Column>
                        <Grid.Column width={8}>
                            <Table size="small" compact definition>
                                <Table.Header fullWidth>
                                    <Table.Row>
                                        <Table.HeaderCell
                                            className={this.props.theme.editTableHeader}
                                        >
                                            User
                                        </Table.HeaderCell>
                                        <Table.HeaderCell
                                            className={this.props.theme.editTableHeader}
                                            collapsing
                                            textAlign="center"
                                            verticalAlign="middle"
                                        >
                                            Access
                                        </Table.HeaderCell>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    <For each="user" of={users}>
                                        <Table.Row key={user.id}>
                                            <Table.Cell>
                                                <NodeImage
                                                    className={this.props.theme.userAvatar}
                                                    path={`${user.node.path}/person/profilePicture`}
                                                    format={{
                                                        width: 35,
                                                        height: 35,
                                                        type: "image"
                                                    }}
                                                    avatar
                                                    spaced="right"
                                                    type="u"
                                                    size="mini"
                                                />
                                                <If condition={user.node.attributes.inactive}>
                                                    <Label
                                                        style={{ float: "right" }}
                                                        color="grey"
                                                        size="mini"
                                                        content="Inactive"
                                                    />
                                                </If>
                                                <div>
                                                    {user.name}
                                                </div>
                                                <small>
                                                    <Choose>
                                                        <When condition={user.owner}>
                                                            Owner
                                                        </When>
                                                        <Otherwise>
                                                            Member of {user.group.name}
                                                        </Otherwise>
                                                    </Choose>
                                                </small>
                                            </Table.Cell>
                                            <Table.Cell
                                                collapsing
                                                textAlign="center"
                                                verticalAlign="middle"
                                                className={this.props.theme.accessText}
                                            >
                                                <Choose>
                                                    <When condition={user.writable}>
                                                        <strong>Read</strong> and <strong>Write</strong>
                                                    </When>
                                                    <Otherwise>
                                                        <strong>Read</strong>
                                                    </Otherwise>
                                                </Choose>
                                            </Table.Cell>
                                        </Table.Row>
                                    </For>
                                </Table.Body>
                            </Table>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </div>
        );
    }
}

Share.propTypes = {
    theme: PropTypes.object,
    node: PropTypes.object.isRequired
};

export default Share;
