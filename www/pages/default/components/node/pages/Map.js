
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import { Map as MapComponent } from "components/map";
import { Marker } from "react-google-maps";

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
        } : undefined; // eslint-disable-line

        return (
            <MapComponent
                defaultZoom={8}
                height={600}
                center={position}
            >
                <If condition={position}>
                    <Marker
                        draggable
                        position={position}
                    />
                </If>
            </MapComponent>
        );
    }
}

Map.propTypes = {
    theme: PropTypes.object,
    node: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired
};

export default Map;
