
import React, { Fragment } from "react";
import PropTypes from "prop-types";
import { List } from "semantic-ui-react";
import Component from "lib/component";
import format from "lib/format";

class Attributes extends Component {
    render() {
        return (
            <Fragment>
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
            </Fragment>
        );
    }
}

Attributes.propTypes = {
    node: PropTypes.object.isRequired
};

export default Attributes;
