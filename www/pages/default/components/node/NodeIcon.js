
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import { Icon } from "semantic-ui-react";

const icons = {
    a: "book",
    c: "camera retro",
    l: "map",
    p: "user circle"
};

class NodeIcon extends Component {
    render() {
        const icon = icons[this.props.type];

        if (!icon) {
            return null;
        }

        return (
            <Icon
                className={this.props.className}
                name={icon}
                bordered={this.props.bordered}
                centered={this.props.centered}
                circular={this.props.circular}
                rotated={this.props.rotated}
                flipped={this.props.flipped}
                size={this.props.size}
            />
        );
    }
}

NodeIcon.propTypes = {
    theme: PropTypes.object,
    className: PropTypes.string,
    type: PropTypes.string.isRequired,
    icon: PropTypes.string,
    bordered: PropTypes.bool,
    centered: PropTypes.bool,
    circular: PropTypes.bool,
    rotated: PropTypes.string,
    flipped: PropTypes.bool,
    size: PropTypes.bool
};

export default NodeIcon;
