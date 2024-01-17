
import React from "react";
import PropTypes from "prop-types";
import { MapContainer, TileLayer, useMapEvent } from "react-leaflet";

const MapEvents = ({ onClick }) => {
    useMapEvent("click", onClick);

    return null;
};

const MapComponent = ({ children, center, height, defaultZoom, onClick }) => {
    const [ zoom, setZoom ] = React.useState(defaultZoom);

    const onZoomEnd = React.useCallback((e) => {
        setZoom(e.target.getZoom());
    }, []);

    const style = React.useMemo(() => ({
        width: "100%",
        height
    }), [ height ]);

    return (
        <MapContainer
            center={center}
            zoom={zoom}
            style={style}
            onClick={onClick}
            onZoomEnd={onZoomEnd}
        >
            <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url="http://{s}.tile.osm.org/{z}/{x}/{y}.png"
            />
            {children}
            <MapEvents
                onClick={onClick}
            />
        </MapContainer>
    );
};

MapComponent.defaultProps = {
    height: 400,
    defaultZoom: 13,
    center: {
        lat: 57.657_277,
        lng: 11.892_222
    }
};

MapComponent.propTypes = {
    children: PropTypes.any,
    center: PropTypes.object,
    height: PropTypes.number,
    defaultZoom: PropTypes.number,
    onClick: PropTypes.func
};

export default MapComponent;
