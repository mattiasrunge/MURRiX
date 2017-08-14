
import React from "react";
import PropTypes from "prop-types";
import { Map as GoogleMap, GoogleApiWrapper as wrap } from "google-maps-react";
import { googleBrowserKey } from "configuration";

class Map extends React.PureComponent {
    render() {
        return (
            <GoogleMap
                {...this.props}
            >
                {this.props.children}
            </GoogleMap>
        );
    }
}

Map.defaultProps = {
    clickableIcons: false
};

Map.propTypes = {
    children: PropTypes.func
};

export default wrap({
    apiKey: googleBrowserKey
})(Map);
