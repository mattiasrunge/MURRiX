
import React from "react";
import Knockout from "components/knockout";
import Comment from "components/comment";



class LocationSectionMedia extends Knockout {
    async getModel() {
        const model = {};

        /* TODO:
         * Load real images
         * Allow drag and drop to set profile picture
         */

        const utils = require("lib/utils");

        model.nodepath = this.props.nodepath;


        return model;
    }

    getTemplate() {
        return (
            ﻿<div className="fadeInDown animated">
                TODO
            </div>

        );
    }
}

export default LocationSectionMedia;
