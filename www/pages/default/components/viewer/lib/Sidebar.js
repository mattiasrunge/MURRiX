
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import { Icon, Header, List } from "semantic-ui-react";
import { Comments } from "components/comment";
import Tags from "./Tags";
import Versions from "./Versions";
import Device from "./Device";
import ParentNode from "./ParentNode";
import ActionMenu from "./ActionMenu";
import Description from "./Description";
import Attributes from "./Attributes";

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
                    <Description
                        theme={this.props.theme}
                        node={this.props.node}
                    />
                    <Device
                        theme={this.props.theme}
                        node={this.props.node}
                    />
                    <Versions
                        theme={this.props.theme}
                        node={this.props.node}
                    />
                    <ParentNode
                        theme={this.props.theme}
                        node={this.props.node}
                    />
                    <Tags
                        theme={this.props.theme}
                        node={this.props.node}
                    />
                    <Attributes
                        theme={this.props.theme}
                        node={this.props.node}
                    />
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
