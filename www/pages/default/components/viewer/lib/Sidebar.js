
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import { Icon, Header, List } from "semantic-ui-react";
import { Comments } from "components/comment";
import format from "lib/format";
import Tags from "./Tags";
import Versions from "./Versions";
import Device from "./Device";
import ParentNode from "./ParentNode";
import ActionMenu from "./ActionMenu";

class Sidebar extends Component {
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

                <ActionMenu
                    theme={this.props.theme}
                    node={this.props.node}
                />

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
                    <List.Item>
                        <List.Icon size="big" name="camera retro" />
                        <List.Content>
                            <Device
                                theme={this.props.theme}
                                node={this.props.node}
                            />
                        </List.Content>
                    </List.Item>
                    <List.Item>
                        <List.Icon size="big" name="download" />
                        <List.Content>
                            <Versions
                                theme={this.props.theme}
                                node={this.props.node}
                            />
                        </List.Content>
                    </List.Item>
                    <List.Item>
                        <List.Icon size="big" name="book" />
                        <List.Content>
                            <ParentNode
                                theme={this.props.theme}
                                node={this.props.node}
                            />
                        </List.Content>
                    </List.Item>
                    <List.Item>
                        <List.Icon size="big" name="user" />
                        <List.Content>
                            <Tags
                                theme={this.props.theme}
                                node={this.props.node}
                            />
                        </List.Content>
                    </List.Item>
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
