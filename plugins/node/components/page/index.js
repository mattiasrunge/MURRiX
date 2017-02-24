
import React from "react";
import Knockout from "components/knockout";

const ko = require("knockout");
const loc = require("lib/location");
const ui = require("lib/ui");

class NodePage extends Knockout {
    async getModel() {
        const model = {};

        model.path = ko.pureComputed(() => ko.unwrap(loc.current().path) || false);
        model.section = ko.pureComputed(() => ko.unwrap(loc.current().section) || "default");
        model.nodepath = ko.nodepath(model.path);

        let subscription = model.nodepath.subscribe((nodepath) => {
            ui.setTitle(nodepath ? nodepath.node().attributes.name : false);
        });

        model.dispose = () => {
            subscription.dispose();
            model.nodepath.dispose();
        };


        return model;
    }

    getTemplate() {
        return (
            <div data-bind="if: nodepath">
                <div data-bind="if: nodepath().node().properties.type === 'p'">
                    <div data-bind="react: { name: 'people-page', params: { nodepath: nodepath, section: section } }"></div>
                </div>
                <div data-bind="if: nodepath().node().properties.type === 'a'">
                    <div data-bind="react: { name: 'album-page', params: { nodepath: nodepath, section: section } }"></div>
                </div>
                <div data-bind="if: nodepath().node().properties.type === 'l'">
                    <div data-bind="react: { name: 'location-page', params: { nodepath: nodepath, section: section } }"></div>
                </div>
                <div data-bind="if: nodepath().node().properties.type === 'c'">
                    <div data-bind="react: { name: 'camera-page', params: { nodepath: nodepath, section: section } }"></div>
                </div>


                <div id="dropTargetContainer">
                    <table>
                        <tbody>
                            <tr>
                                <td className="text-center">
                                    <div id="dropTargetProfilePicture" className="dropTarget text-muted text-uppercase">
                                        Drop here
                                        <br />
                                        <br />
                                        <i className="material-icons md-96">wallpaper</i>
                                        <br />
                                        <br />
                                        Use as profile picture
                                    </div>
                                </td>
                                <td className="text-center">
                                    <div id="dropTargetDelete" className="dropTarget text-muted text-uppercase" style={{ backgroundColor: "#FFAEAE" }}>
                                        Drop here
                                        <br />
                                        <br />
                                        <i className="material-icons md-96">delete</i>
                                        <br />
                                        <br />
                                        Delete
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

        );
    }
}

export default NodePage;
