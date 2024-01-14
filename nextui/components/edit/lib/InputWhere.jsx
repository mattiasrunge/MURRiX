
import React from "react";
import PropTypes from "prop-types";
import { Form, Grid } from "semantic-ui-react";
import { Marker } from "react-leaflet";
import { Icon } from "leaflet";
import { Map } from "components/map";
import theme from "../theme.module.css";

const markerIcon = new Icon({
    iconUrl: "/marker-icon.png",
    shadowUrl: "/marker-shadow.png"
});

const InputWhere = ({ disabled, label, name, value, onChange }) => {
    const position = React.useMemo(() => value?.manual?.longitude && value?.manual?.latitude ? {
        lat: value?.manual?.latitude ?? "",
        lng: value?.manual?.longitude ?? ""
    } : undefined, [ value ]); // eslint-disable-line no-undefined

    const setPosition = React.useCallback((longitude, latitude) => {
        const valueObject = {
            ...(value || {}),
            manual: {
                longitude,
                latitude
            }
        };

        onChange(name, valueObject);
    }, [ name, value, onChange ]);

    const onDragEnd = React.useCallback((e) => {
        const { lng, lat } = e.target.getLatLng();

        setPosition(lng, lat);
    }, [ setPosition ]);

    const onMapClick = React.useCallback((e) => {
        setPosition(e.latlng.lng, e.latlng.lat);
    }, [ setPosition ]);

    const onLongitude = React.useCallback((e, { value }) => {
        setPosition(Number.parseFloat(value), position?.lat ?? 0);
    }, [ setPosition, position ]);

    const onLatitude = React.useCallback((e, { value }) => {
        setPosition(position?.lng ?? 0, Number.parseFloat(value));
    }, [ setPosition, position ]);

    return (
        <Form.Field>
            <label>{label}</label>
            <Grid>
                <Grid.Row>
                    <Grid.Column width={12}>
                        <div className={theme.inputWhereFrameMap}>
                            <Map
                                defaultZoom={8}
                                onClick={onMapClick}
                                height={300}
                                center={position}
                            >
                                <If condition={position}>
                                    <Marker
                                        draggable
                                        position={position}
                                        onDragEnd={onDragEnd}
                                        icon={markerIcon}
                                    />
                                </If>
                            </Map>
                        </div>
                    </Grid.Column>
                    <Grid.Column width={4}>
                        <Form.Field>
                            <label>Longitude</label>
                            <Form.Input
                                value={value?.manual?.longitude}
                                disabled={disabled}
                                onChange={onLongitude}
                                size="mini"
                                type="number"
                            />
                        </Form.Field>
                        <Form.Field>
                            <label>Latitude</label>
                            <Form.Input
                                value={value?.manual?.latitude}
                                disabled={disabled}
                                onChange={onLatitude}
                                size="mini"
                                type="number"
                            />
                        </Form.Field>
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        </Form.Field>
    );
};

InputWhere.propTypes = {
    error: PropTypes.bool,
    disabled: PropTypes.bool,
    label: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    value: PropTypes.object,
    onChange: PropTypes.func.isRequired
};

export default InputWhere;
