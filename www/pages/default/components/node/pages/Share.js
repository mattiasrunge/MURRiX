
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";

class Share extends Component {
    render() {
        return (
            <span>Share</span>
        );
    }
}

Share.propTypes = {
    theme: PropTypes.object,
    node: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired
};

export default Share;
