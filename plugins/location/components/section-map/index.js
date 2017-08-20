
import api from "api.io-client";
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import Map from "components/map";
import stat from "lib/status";

class LocationSectionMap extends Component {
    constructor(props) {
        super(props);

        this.state = {
            position: false
        };
    }

    componentDidMount() {
        this.load(this.props.nodepath);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.nodepath !== this.props.nodepath) {
            this.load(nextProps.nodepath);
        }
    }

    async load(nodepath) {
        if (!nodepath) {
            return this.setState({ nodepath, position: false });
        }

        if (!nodepath.node.attributes.address) {
            return this.setState({ nodepath, position: false });
        }

        try {
            const location = await api.lookup.getPositionFromAddress(nodepath.node.attributes.address.replace("<br>", "\n"));
            const position = {
                lat: location.latitude,
                lng: location.longitude
            };

            console.log(position);

            return this.setState({ nodepath, position });
        } catch (error) {
            stat.printError(error);
            this.setState({ nodepath, position: false });
        }
    }

    render() {
        return (
            <div className="fadeInDown animated">
                <div style={{ top: 0, left: 15, bottom: 0, right: 0, position: "absolute" }}>
                    <If condition={this.state.position}>
                        <Map
                            style={{ width: "100%", height: "100%" }}
                            initialCenter={this.state.position}
                            zoom={15}
                        >
                        </Map>
                    </If>
                </div>
            </div>
        );
    }
}

LocationSectionMap.propTypes = {
    nodepath: PropTypes.object.isRequired
};

export default LocationSectionMap;
