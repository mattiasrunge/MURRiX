
import React from "react";
import PropTypes from "prop-types";
import { Icon } from "semantic-ui-react";
import Component from "lib/component";

const icons = {
    "unknown": "file outline",
    "application/pdf": "file pdf outline",
    "application/zip": "file archive outline",
    "image": "file image outline",
    "video": "file video outline",
    "audio": "file audio outline",
    "text": "file text outline"
};

class FileIcon extends Component {
    render() {
        const icon = icons[this.props.type] || icons[this.props.type.split("/")[0]] || icons.unknown;

        if (!icon) {
            return null;
        }

        return (
            <Icon
                className={this.props.className}
                name={icon}
                title={this.props.type}
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
