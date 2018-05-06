
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import NodeIcon from "./NodeIcon";

class NodeLink extends Component {
    onClick = () => {
        this.context.router.history.push(`/node${this.props.node.path}`);
    }

    render() {
        return (
            <a
                onClick={this.onClick}
                className={this.classNames(this.props.theme.nodeLink, this.props.className)}
            >
                <If condition={this.props.icon}>
                    <NodeIcon
                        theme={this.props.theme}
                        type={this.props.node.properties.type}
                    />
                </If>
                {this.props.node.attributes.name}
            </a>
        );
    }
}

NodeLink.propTypes = {
    theme: PropTypes.object,
    className: PropTypes.string,
    node: PropTypes.object.isRequired,
    icon: PropTypes.bool
};

NodeLink.contextTypes = {
    router: PropTypes.object.isRequired
};

export default NodeLink;
