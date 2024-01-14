
import React from "react";
import PropTypes from "prop-types";
import { Marker, Tooltip } from "react-leaflet";
import Component from "lib/component";
import { Map as MapComponent, Address } from "components/map";

class Map extends Component {
    getPosition = () => {
        const hasPosition = this.props.node.attributes.where && this.props.node.attributes.where.manual;
        const longitude = hasPosition ? this.props.node.attributes.where.manual.longitude : "";
        const latitude = hasPosition ? this.props.node.attributes.where.manual.latitude : "";

        return { longitude, latitude };
    }

    render() {
        const { longitude, latitude } = this.getPosition();
        const position = longitude && latitude ? {
            lat: latitude,
            lng: longitude
        } : undefined; // eslint-disable-line no-undefined

        return (
            <MapComponent
                defaultZoom={8}
                height={600}
                center={position}
            >
                <If condition={position}>
                    <Marker
                        position={position}
                    >
                        <Tooltip>
                            <Address longitude={position.lng} latitude={position.lat} />
                        </Tooltip>
                    </Marker>
                </If>
            </MapComponent>
        );
    }
}

Map.propTypes = {
    node: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired
};

export default Map;
