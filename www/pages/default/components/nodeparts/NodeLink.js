
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";

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
                {this.props.node.attributes.name}
            </a>
        );
    }
}

NodeLink.propTypes = {
    theme: PropTypes.object,
    className: PropTypes.string,
    node: PropTypes.object.isRequired
};

NodeLink.contextTypes = {
    router: PropTypes.object.isRequired
};

export default NodeLink;
