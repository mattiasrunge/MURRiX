
import ko from "knockout";
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import Map from "components/map";

class LocationSectionMap extends Component {
    constructor(props) {
        super(props);

        this.state = {
            position: ko.unwrap(this.props.position)
        };
    }

    componentDidMount() {
        if (ko.isObservable(this.props.position)) {
            this.addDisposables([
                this.props.position.subscribe((position) => this.setState({ position }))
            ]);
        }
    }

    render() {
        return (
            ﻿<div className="fadeInDown animated">
                <div style={{ height: 500, position: "relative" }}>
                    <If condition={this.state.position}>
                        <Map
                            style={{ width: "100%", height: "100%" }}
                            initialCenter={{
                                lat: this.state.position.latitude,
                                lng: this.state.position.longitude
                            }}
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
    position: PropTypes.any
};

export default LocationSectionMap;
