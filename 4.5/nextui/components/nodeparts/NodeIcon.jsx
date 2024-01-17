
import React from "react";
import PropTypes from "prop-types";
import { Icon } from "semantic-ui-react";

const ICONS = {
    a: "book",
    c: "camera retro",
    l: "map",
    p: "user",
    u: "user circle"
};

const NodeIcon = ({ className, type, title, bordered, centered, circular, rotated, flipped, size }) => {
    const icon = ICONS[type];

    if (!icon) {
        return null;
    }

    return (
        <Icon
            className={className}
            name={icon}
            title={title}
            bordered={bordered}
            centered={centered}
            circular={circular}
            rotated={rotated}
            flipped={flipped}
            size={size}
        />
    );
};

NodeIcon.propTypes = {
    className: PropTypes.string,
    type: PropTypes.string.isRequired,
    title: PropTypes.string,
    bordered: PropTypes.bool,
    centered: PropTypes.bool,
    circular: PropTypes.bool,
    rotated: PropTypes.string,
    flipped: PropTypes.bool,
    size: PropTypes.string
};

export default NodeIcon;
