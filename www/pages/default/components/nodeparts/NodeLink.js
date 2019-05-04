
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import { Link } from "react-router-dom";
import NodeIcon from "./NodeIcon";

class NodeLink extends Component {
    render() {
        return (
            <Link
                to={`/node${this.props.node.path}`}
                className={this.classNames(this.props.theme.nodeLink, this.props.className)}
            >
                <If condition={this.props.icon}>
                    <NodeIcon
                        theme={this.props.theme}
                        type={this.props.node.properties.type}
                    />
                </If>
                {this.props.node.attributes.name}
            </Link>
        );
    }
}

NodeLink.propTypes = {
    theme: PropTypes.object,
    className: PropTypes.string,
    node: PropTypes.object.isRequired,
    icon: PropTypes.bool
};

export default NodeLink;
