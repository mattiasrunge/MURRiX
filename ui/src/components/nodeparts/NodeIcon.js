
import React from "react";
import PropTypes from "prop-types";
import { Icon } from "semantic-ui-react";
import Component from "lib/component";

const icons = {
    a: "book",
    c: "camera retro",
    l: "map",
    p: "user",
    u: "user circle"
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
                title={this.props.title}
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
    className: PropTypes.string,
    type: PropTypes.string.isRequired,
    title: PropTypes.string,
    icon: PropTypes.string,
    bordered: PropTypes.bool,
    centered: PropTypes.bool,
    circular: PropTypes.bool,
    rotated: PropTypes.string,
    flipped: PropTypes.bool,
    size: PropTypes.string
};

export default NodeIcon;
