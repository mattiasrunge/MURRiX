
import React from "react";
import Knockout from "components/knockout";
import Comment from "components/comment";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");

class PeopleSectionMedia extends Knockout {
    async getModel() {
        const model = {};

        model.loading = stat.create();
        model.nodepath = this.props.nodepath;
        model.size = 226;

        model.data = ko.asyncComputed([], async (setter) => {
            let result = {
                files: [],
                texts: []
            };

            if (!model.nodepath()) {
                return result;
            }

            setter(result);

            model.loading(true);
            result.files = await api.people.findByTags(model.nodepath().path);
            model.loading(false);

            result.files = result.files.map((file) => {
                file.node = ko.observable(file.node);
                return file;
            });

            return result;
        }, (error) => {
            model.loading(false);
            stat.printError(error);
            return {
                files: [],
                texts: []
            };
        });

        model.dispose = () => {
            stat.destroy(model.loading);
        };


        return model;
    }

    getTemplate() {
        return (
            ﻿<div className="fadeInDown animated">
                <div data-bind="react: { name: 'file-widget-grid', params: { data: data, size: size, nodepath: nodepath } }" style={{ display: "block", paddingTop: "15px", paddingBottom: "15px" }}></div>
            </div>

        );
    }
}

export default PeopleSectionMedia;
