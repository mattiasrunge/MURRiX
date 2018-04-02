
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";

class Edit extends Component {
    render() {
        return (
            <span>Edit</span>
        );
    }
}

Edit.propTypes = {
    theme: PropTypes.object,
    node: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired
};

export default Edit;
