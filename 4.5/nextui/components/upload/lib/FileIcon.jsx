
import React from "react";
import PropTypes from "prop-types";
import { Icon } from "semantic-ui-react";

const ICONS = {
    "unknown": "file outline",
    "application/pdf": "file pdf outline",
    "application/zip": "file archive outline",
    "image": "file image outline",
    "video": "file video outline",
    "audio": "file audio outline",
    "text": "file text outline"
};

const FileIcon = ({ className, type, bordered, centered, circular, rotated, flipped, size }) => {
    const icon = ICONS[type] || ICONS[type.split("/")[0]] || ICONS.unknown;

    if (!icon) {
        return null;
    }

    return (
        <Icon
            className={className}
            name={icon}
            title={type}
            bordered={bordered}
            centered={centered}
            circular={circular}
            rotated={rotated}
            flipped={flipped}
            size={size}
        />
    );
};

FileIcon.propTypes = {
    className: PropTypes.string,
    type: PropTypes.string.isRequired,
    bordered: PropTypes.bool,
    centered: PropTypes.bool,
    circular: PropTypes.bool,
    rotated: PropTypes.string,
    flipped: PropTypes.bool,
    size: PropTypes.string
};

export default FileIcon;
