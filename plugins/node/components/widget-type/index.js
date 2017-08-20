
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";

const types = {
    "a": "album",
    "l": "location",
    "p": "person",
    "c": "camera",
    "d": "directory",
    "f": "file",
    "s": "symlink",
    "k": "comment",
    "r": "root"
};

class NodeWidgetType extends Component {
    render() {
        return (
            <span>{types[this.props.type] || "unknown"}</span>
        );
    }
}

NodeWidgetType.propTypes = {
    type: PropTypes.string.isRequired
};

export default NodeWidgetType;
