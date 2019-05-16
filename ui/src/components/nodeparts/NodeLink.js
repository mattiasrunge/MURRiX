
import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import Component from "lib/component";
import NodeIcon from "./NodeIcon";
import theme from "./theme.module.css";

class NodeLink extends Component {
    render() {
        return (
            <Link
                to={`/node${this.props.node.path}`}
                className={this.classNames(theme.nodeLink, this.props.className)}
            >
                <If condition={this.props.icon}>
                    <NodeIcon
                        theme={theme}
                        type={this.props.node.properties.type}
                    />
                </If>
                {this.props.node.attributes.name}
            </Link>
        );
    }
}

NodeLink.propTypes = {
    className: PropTypes.string,
    node: PropTypes.object.isRequired,
    icon: PropTypes.bool
};

export default NodeLink;
