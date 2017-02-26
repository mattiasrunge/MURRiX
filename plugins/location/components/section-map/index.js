
import React from "react";
import Knockout from "components/knockout";
import Comment from "components/comment";

const utils = require("lib/utils");

class LocationSectionMap extends Knockout {
    async getModel() {
        const model = {};

        model.nodepath = this.props.nodepath;
        model.position = this.props.position;


        return model;
    }

    getTemplate() {
        return (
            ﻿<div className="fadeInDown animated">
                <div style={{ height: "500px" }} data-bind="map: { position: position, zoom: position() ? 15 : 10 }"></div>
            </div>

        );
    }
}

export default LocationSectionMap;
