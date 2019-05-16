
import React from "react";
import PropTypes from "prop-types";
import { Form, Grid } from "semantic-ui-react";
import { Marker } from "react-leaflet";
import Component from "lib/component";
import { Map } from "components/map";
import theme from "../theme.module.css";

class InputWhere extends Component {
    setPosition = (longitude, latitude) => {
        const valueObject = {
            ...(this.props.value || {})
        };

        valueObject.manual = {
            longitude,
            latitude
        };

        this.props.onChange(this.props.name, valueObject);
    }

    onDragEnd = (e) => {
        const position = e.target.getLatLng();

        this.setPosition(position.lng, position.lat);
    }

    onMapClick = (e) => {
        this.setPosition(e.latlng.lng, e.latlng.lat);
    }

    onLongitude = (e, { value }) => {
        this.setPosition(parseFloat(value), this.getPosition().latitude || 0);
    }

    onLatitude = (e, { value }) => {
        this.setPosition(this.getPosition().longitude || 0, parseFloat(value));
    }

    getPosition = () => {
        const hasPosition = this.props.value && this.props.value.manual;
        const longitude = hasPosition ? this.props.value.manual.longitude : "";
        const latitude = hasPosition ? this.props.value.manual.latitude : "";

        return { longitude, latitude };
    }

    render() {
        const { longitude, latitude } = this.getPosition();
        const position = longitude && latitude ? {
            lat: latitude,
            lng: longitude
        } : undefined; // eslint-disable-line no-undefined

        return (
            <Form.Field>
                <label>{this.props.label}</label>
                <Grid>
                    <Grid.Row>
                        <Grid.Column width={12}>
                            <div className={theme.inputWhereFrameMap}>
                                <Map
                                    defaultZoom={8}
                                    onClick={this.onMapClick}
                                    height={300}
                                    center={position}
                                >
                                    <If condition={position}>
                                        <Marker
                                            draggable
                                            position={position}
                                            onDragEnd={this.onDragEnd}
                                        />
                                    </If>
                                </Map>
                            </div>
                        </Grid.Column>
                        <Grid.Column width={4}>
                            <Form.Field>
                                <label>Longitude</label>
                                <Form.Input
                                    value={longitude}
                                    disabled={this.props.disabled}
                                    onChange={this.onLongitude}
                                    size="mini"
                                    type="number"
                                />
                            </Form.Field>
                            <Form.Field>
                                <label>Latitude</label>
                                <Form.Input
                                    value={latitude}
                                    disabled={this.props.disabled}
                                    onChange={this.onLatitude}
                                    size="mini"
                                    type="number"
                                />
                            </Form.Field>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>

            </Form.Field>
        );
    }
}

InputWhere.propTypes = {
    error: PropTypes.bool,
    disabled: PropTypes.bool,
    label: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    value: PropTypes.object,
    onChange: PropTypes.func.isRequired
};

export default InputWhere;
