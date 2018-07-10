
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import { List } from "semantic-ui-react";

class Description extends Component {
    render() {
        return (
            <If condition={this.props.node.attributes.description}>
                <List.Item>
                    <List.Icon size="big" name="file alternate" />
                    <List.Content>
                        {this.props.node.attributes.description}
                    </List.Content>
                </List.Item>
            </If>
        );
    }
}

Description.propTypes = {
    theme: PropTypes.object,
    node: PropTypes.object.isRequired
};

export default Description;
