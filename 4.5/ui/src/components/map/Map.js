
import React from "react";
import PropTypes from "prop-types";
import { MapContainer, TileLayer } from "react-leaflet";

class MapComponent extends React.PureComponent {
    constructor(props) {
        super();

        this.state = {
            zoom: props.defaultZoom
        };
    }

    onZoomEnd = (e) => {
        this.setState({ zoom: e.target.getZoom() });
    }

    render() {
        return (
            <MapContainer
                center={this.props.center}
                zoom={this.state.zoom}
                style={{
                    width: "100%",
                    height: this.props.height
                }}
                onClick={this.props.onClick}
                onZoomEnd={this.onZoomEnd}
            >
                <TileLayer
                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    url="http://{s}.tile.osm.org/{z}/{x}/{y}.png"
                />
                {this.props.children}
            </MapContainer>
        );
    }
}

MapComponent.defaultProps = {
    height: 400,
    defaultZoom: 13,
    center: {
        lat: 57.657277,
        lng: 11.892222
    }
};

MapComponent.propTypes = {
    children: PropTypes.any,
    center: PropTypes.any,
    height: PropTypes.number,
    defaultZoom: PropTypes.number,
    onClick: PropTypes.func
};

export default MapComponent;
