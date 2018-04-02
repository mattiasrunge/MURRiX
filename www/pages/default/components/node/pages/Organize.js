
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";

class Organize extends Component {
    render() {
        return (
            <span>Organize</span>
        );
    }
}

Organize.propTypes = {
    theme: PropTypes.object,
    node: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired
};

export default Organize;
