
import React from "react";
import PropTypes from "prop-types";
import { Header, Grid, Table, Label, Checkbox } from "semantic-ui-react";
import Component from "lib/component";
import { cmd } from "lib/backend";
import notification from "lib/notification";
import utils from "lib/utils";
import { NodeImage } from "components/nodeparts";
import theme from "../../theme.module.css";

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
        const users = await cmd.users();

        const owner = users.find((user) => user.attributes.uid === this.props.node.properties.uid);

        const list = [
            {
                id: owner._id,
                name: owner.attributes.name,
                node: owner,
                readable: !!(this.props.node.properties.mode & utils.MASKS.OWNER.READ),
                writable: !!(this.props.node.properties.mode & utils.MASKS.OWNER.WRITE),
                owner: true
            }
        ];

        for (const group of groups) {
            if (group.readable || group.writable) {
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
                readable: !!(this.props.node.properties.mode & utils.MASKS.GROUP.READ),
                writable: !!(this.props.node.properties.mode & utils.MASKS.GROUP.WRITE)
            };
        }

        const ac = this.props.node.properties.acl.find((ac) => ac.gid === group.attributes.gid);

        if (ac) {
            return {
                ac,
                readable: !!(ac.mode & utils.MASKS.ACL.READ),
                writable: !!(ac.mode & utils.MASKS.ACL.WRITE)
            };
        }

        return {};
    }

    async createGroupList(groups) {
        return Promise.all(groups.map(async (group) => {
            const access = this.getGroupAccess(group);
            const users = await cmd.users(group.name);

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

                mode |= currentMode & utils.MASKS.OWNER.READ ? utils.MASKS.OWNER.READ : 0;
                mode |= currentMode & utils.MASKS.OWNER.WRITE ? utils.MASKS.OWNER.WRITE : 0;
                mode |= currentMode & utils.MASKS.OWNER.EXEC ? utils.MASKS.OWNER.EXEC : 0;

                mode |= readable || writable ? utils.MASKS.GROUP.READ : 0;
                mode |= writable ? utils.MASKS.GROUP.WRITE : 0;
                mode |= readable || writable ? utils.MASKS.GROUP.EXEC : 0;

                mode |= currentMode & utils.MASKS.OTHER.READ ? utils.MASKS.OTHER.READ : 0;
                mode |= currentMode & utils.MASKS.OTHER.WRITE ? utils.MASKS.OTHER.WRITE : 0;
                mode |= currentMode & utils.MASKS.OTHER.EXEC ? utils.MASKS.OTHER.EXEC : 0;

                if (mode !== currentMode) {
                    await cmd.chmod(this.props.node.path, mode, { recursive: true });
                }
            } else {
                const currentMode = access.ac ? access.ac.mode : 0;
                let mode = 0;

                mode |= readable || writable ? utils.MASKS.ACL.READ : 0;
                mode |= writable ? utils.MASKS.ACL.WRITE : 0;
                mode |= readable || writable ? utils.MASKS.ACL.EXEC : 0;

                if (mode !== currentMode) {
                    await cmd.setfacl(this.props.node.path, {
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
            const groupNodes = await cmd.groups();
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
                    {/* <Checkbox
                        className={theme.shareUsersToggle}
                        label="Show inactive users"
                        checked={this.state.showInactive}
                        onChange={this.onChangeInactiveUsers}
                    /> */}
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
                                            className={theme.editTableHeader}
                                        >
                                            Group
                                        </Table.HeaderCell>
                                        <Table.HeaderCell
                                            className={theme.editTableHeader}
                                            collapsing
                                            textAlign="center"
                                            verticalAlign="middle"
                                        >
                                            Read
                                        </Table.HeaderCell>
                                        <Table.HeaderCell
                                            className={theme.editTableHeader}
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
                                                            className={theme.groupUserAvatar}
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
                                            className={theme.editTableHeader}
                                        >
                                            User
                                        </Table.HeaderCell>
                                        <Table.HeaderCell
                                            className={theme.editTableHeader}
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
                                                    className={theme.userAvatar}
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
                                                className={theme.accessText}
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
    node: PropTypes.object.isRequired
};

export default Share;
