
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";

class Family extends Component {
    render() {
        return (
            <span>Family</span>
        );
    }
}

Family.propTypes = {
    theme: PropTypes.object,
    node: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired
};

export default Family;
