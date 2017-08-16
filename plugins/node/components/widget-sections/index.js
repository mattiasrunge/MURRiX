
import React from "react";
import Knockout from "components/knockout";
import loc from "lib/location";
import ko from "knockout";

class NodeWidgetSections extends Knockout {
    async getModel() {
        const model = {};

        model.params = this.props.params;
        model.section = ko.pureComputed(() => ko.unwrap(loc.current().section) || "default");
        model.sections = this.props.sections;

        return model;
    }

    getTemplate() {
        return (
            <div>
                <div className="row">
                    <ul className="nav nav-pills" style={{ marginLeft: "15px", marginRight: "15px", width: "100%" }} data-bind="foreach: sections">
                        <li className="nav-item" data-bind="css: { active: $root.section() === $data.name || ($index() === 0 && $root.section() === 'default'), 'mr-auto': $index() === $root.sections.length - 1 }">
                            <a className="nav-link" data-bind="location: { section: $data.name }">
                                <i className="material-icons md-18" data-bind="text: $data.icon"></i>
                                <span> </span>
                                <span data-bind="text: $data.title"></span>
                            </a>
                        </li>
                    </ul>
                </div>

                <div data-bind="foreach: sections">
                    <div data-bind="if: $root.section() === $data.name || ($index() === 0 && $root.section() === 'default')">
                        <div data-bind="react: { name: $data.react, params: $root.params }"></div>
                    </div>
                </div>
                <div data-bind="if: $root.section() === 'upload'">
                    <div data-bind="react: { name: 'node-section-upload', params: $root.params }"></div>
                </div>
                <div data-bind="if: $root.section() === 'share'">
                    <div data-bind="react: { name: 'node-section-share', params: $root.params }"></div>
                </div>
                <div data-bind="if: $root.section() === 'move'">
                    <div data-bind="react: { name: 'node-section-move', params: $root.params }"></div>
                </div>
            </div>

        );
    }
}

export default NodeWidgetSections;
