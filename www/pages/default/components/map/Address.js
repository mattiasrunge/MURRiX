
import React from "react";
import PropTypes from "prop-types";
import { Loader } from "semantic-ui-react";
import Component from "lib/component";
import api from "api.io-client";

class Address extends Component {
    constructor(props) {
        super(props);

        this.state = {
            address: "",
            loading: false
        };
    }

    async load() {
        this.update(this.props.longitude, this.props.latitude);
    }

    componentDidUpdate(prevProps) {
        if (prevProps.longitude !== this.props.longitude || prevProps.latitude !== this.props.latitude) {
            this.update(this.props.longitude, this.props.latitude);
        }
    }

    async update(longitude, latitude) {
        try {
            this.setState({ address: "", loading: true });

            const address = await api.geolocation.position2address(longitude, latitude);

            this.setState({ address, loading: false });
        } catch (error) {
            console.error(longitude, latitude, error);
            this.setState({ address: "Failed to resolve address", loading: false });
        }
    }

    render() {
        return (
            <Choose>
                <When condition={this.state.loading}>
                    <Loader active />
                </When>
                <Otherwise>
                    <span>{this.state.address}</span>
                </Otherwise>
            </Choose>
        );
    }
}

Address.propTypes = {
    latitude: PropTypes.number.isRequired,
    longitude: PropTypes.number.isRequired
};

export default Address;
