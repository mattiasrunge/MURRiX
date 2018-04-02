
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";

class Map extends Component {
    render() {
        return (
            <span>Map</span>
        );
    }
}

Map.propTypes = {
    theme: PropTypes.object,
    node: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired
};

export default Map;
