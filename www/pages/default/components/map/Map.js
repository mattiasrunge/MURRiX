
import React from "react";
import PropTypes from "prop-types";
import { withScriptjs, withGoogleMap, GoogleMap } from "react-google-maps";
import { googleBrowserKey } from "configuration";

const WrappedMap = withScriptjs(withGoogleMap((props) =>
    <GoogleMap {...props}/>
));

class Map extends React.PureComponent {
    render() {
        return (
            <WrappedMap
                googleMapURL={`https://maps.googleapis.com/maps/api/js?key=${googleBrowserKey}&v=3.exp&libraries=geometry,drawing,places`}
                loadingElement={<div style={{ height: "100%" }} />}
                containerElement={<div style={{ height: this.props.height }} />}
                mapElement={<div style={{ height: "100%" }} />}
                {...this.props}
            >
                {this.props.children}
            </WrappedMap>
        );
    }
}

Map.defaultProps = {
    height: 400,
    center: {
        lat: 57.657277,
        lng: 11.892222
    }
};

Map.propTypes = {
    children: PropTypes.any,
    center: PropTypes.any,
    height: PropTypes.number
};

export default Map;
