
import React from "react";
import Knockout from "components/knockout";

const ko = require("knockout");
const utils = require("lib/utils");
const stat = require("lib/status");

class AlbumSectionMedia extends Knockout {
    async getModel() {
        const model = {};

        model.loading = stat.create();
        model.nodepath = this.props.nodepath;
        model.size = 226;

        model.filesPath = ko.pureComputed(() => model.nodepath() ? model.nodepath().path + "/files" : false);
        model.files = ko.nodepathList(model.filesPath, { noerror: true });

        model.textsPath = ko.pureComputed(() => model.nodepath() ? model.nodepath().path + "/texts" : false);
        model.texts = ko.nodepathList(model.textsPath, { noerror: true });

        model.data = ko.pureComputed(() => {
            let files = model.files();
            let texts = model.texts();

            return {
                files: model.files.hasLoaded() ? files : [],
                texts: model.texts.hasLoaded() ? texts : []
            };
        });

        model.dispose = () => {
            model.files.dispose();
            model.texts.dispose();
            stat.destroy(model.loading);
        };


        return model;
    }

    getTemplate() {
        return (
            ﻿<div className="">
                <div data-bind="react: { name: 'file-widget-grid', params: { data: data, size: size, nodepath: nodepath } }" style={{ display: "block", paddingTop: "15px", paddingBottom: "15px" }}></div>
            </div>

        );
    }
}

export default AlbumSectionMedia;
