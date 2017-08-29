
import React from "react";
import PropTypes from "prop-types";
import { Map as GoogleMap, GoogleApiWrapper as wrap } from "google-maps-react";
import { googleBrowserKey } from "configuration";

class Map extends React.PureComponent {
    render() {
        const initialCenter = this.props.position || {
            lat: 57.657277,
            lng: 11.892222
        };

        return (
            <GoogleMap
                {...this.props}
                initialCenter={initialCenter}
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
    children: PropTypes.func,
    position: PropTypes.any
};

export default wrap({
    apiKey: googleBrowserKey
})(Map);
