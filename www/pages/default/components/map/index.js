
import React from "react";
import PropTypes from "prop-types";
import { Map as GoogleMap, GoogleApiWrapper as wrap } from "google-maps-react";
import { googleBrowserKey } from "configuration";

class Map extends React.PureComponent {
    render() {
        return (
            <GoogleMap
                {...this.props}
                initialCenter={{
                    lat: this.props.position.latitude,
                    lng: this.props.position.longitude
                }}
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
    position: PropTypes.object
};

export default wrap({
    apiKey: googleBrowserKey
})(Map);
