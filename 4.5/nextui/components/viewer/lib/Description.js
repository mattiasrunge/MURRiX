
import React from "react";
import PropTypes from "prop-types";
import { List } from "semantic-ui-react";
import Component from "lib/component";
import theme from "../theme.module.css";

class Description extends Component {
    render() {
        return (
            <If condition={this.props.node.attributes.description}>
                <List.Item>
                    <List.Icon size="big" name="file alternate" />
                    <List.Content className={theme.sidebarText}>
                        {this.props.node.attributes.description}
                    </List.Content>
                </List.Item>
            </If>
        );
    }
}

Description.propTypes = {
    node: PropTypes.object.isRequired
};

export default Description;
