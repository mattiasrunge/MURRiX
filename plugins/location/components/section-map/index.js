
import ko from "knockout";
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
            target: false,
            position: false,
            nodepath: ko.unwrap(props.nodepath)
        };
    }

    componentDidMount() {
        this.addDisposables([
            this.props.nodepath.subscribe((nodepath) => this.load(nodepath))
        ]);

        this.load(ko.unwrap(this.props.nodepath));
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.nodepath !== nextProps.nodepath) {
            this.load(ko.unwrap(nextProps.nodepath));
        }
    }

    async load(nodepath) {
        if (!nodepath) {
            return this.setState({ nodepath, target: false, position: false });
        }

        const node = ko.unwrap(nodepath.node);

        if (!node || !node.attributes.address) {
            return this.setState({ nodepath, target: false, position: false });
        }

        try {
            const location = await api.lookup.getPositionFromAddress(node.attributes.address.replace("<br>", "\n"));
            const position = {
                lat: location.latitude,
                lng: location.longitude
            };

            console.log(position);

            return this.setState({ nodepath, target: node, position });
        } catch (error) {
            stat.printError(error);
            this.setState({ nodepath, target: false, position: false });
        }
    }

    render() {
        return (
            ﻿<div className="fadeInDown animated">
                <div style={{ top: 44, left: 15, bottom: 0, right: 0, position: "absolute" }}>
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
    nodepath: PropTypes.any
};

export default LocationSectionMap;
