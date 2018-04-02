
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";

class Upload extends Component {
    render() {
        return (
            <span>Upload</span>
        );
    }
}

Upload.propTypes = {
    theme: PropTypes.object,
    node: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired
};

export default Upload;
