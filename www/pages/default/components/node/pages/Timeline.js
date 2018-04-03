
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";

class Timeline extends Component {
    render() {
        return (
            <span>Timeline</span>
        );
    }
}

Timeline.propTypes = {
    theme: PropTypes.object,
    node: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired
};

export default Timeline;
