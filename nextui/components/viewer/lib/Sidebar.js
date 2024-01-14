
import React from "react";
import PropTypes from "prop-types";
import { Icon, Header, List } from "semantic-ui-react";
import Component from "lib/component";
import { Comments } from "components/comment";
import Tags from "./Tags";
import Versions from "./Versions";
import Device from "./Device";
import ParentNode from "./ParentNode";
import ActionMenu from "./ActionMenu";
import Description from "./Description";
import Attributes from "./Attributes";
import { EditModal } from "components/edit";
import { TagModal } from "components/tagging";
import theme from "../theme.module.css";

class Sidebar extends Component {
    constructor(props) {
        super(props);

        this.state = {
            edit: false,
            tag: false
        };
    }

    onEdit = () => {
        this.setState({ edit: true });
    }

    onCloseEdit = () => {
        this.setState({ edit: false });
    }

    onTag = () => {
        this.setState({ tag: true });
    }

    onCloseTag = () => {
        this.setState({ tag: false });
    }

    render() {
        return (
            <div className={theme.sidebarContainer}>
                <If condition={this.state.edit}>
                    <EditModal
                        node={this.props.node}
                        onClose={this.onCloseEdit}
                    />
                </If>
                <If condition={this.state.tag}>
                    <TagModal
                        node={this.props.node}
                        onClose={this.onCloseTag}
                    />
                </If>
                <Icon
                    className={theme.sidebarCloseIcon}
                    link
                    fitted
                    size="large"
                    name="close"
                    onClick={this.props.onClose}
                />

                <ActionMenu
                    theme={theme}
                    node={this.props.node}
                    onEdit={this.onEdit}
                    onTag={this.onTag}
                />

                <Header as="h2">Details</Header>
                <List
                    divided
                    relaxed="very"
                    verticalAlign="middle"
                    className={theme.sidebarList}
                >
                    <Description
                        theme={theme}
                        node={this.props.node}
                    />
                    <Device
                        theme={theme}
                        node={this.props.node}
                    />
                    <Versions
                        theme={theme}
                        node={this.props.node}
                    />
                    <ParentNode
                        theme={theme}
                        node={this.props.node}
                    />
                    <Tags
                        theme={theme}
                        node={this.props.node}
                    />
                    <Attributes
                        theme={theme}
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
    node: PropTypes.object.isRequired,
    onClose: PropTypes.func.isRequired
};

export default Sidebar;
