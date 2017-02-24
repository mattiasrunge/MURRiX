
import React from "react";
import Knockout from "components/knockout";

const ko = require("knockout");
const utils = require("lib/utils");

class FeedWidgetTodayMarriage extends Knockout {
    async getModel() {
        const model = {};

        model.nodepath = ko.pureComputed(() => ko.unwrap(this.props.nodepath));


        return model;
    }

    getTemplate() {
        return (
            <div>
                <i className="material-icons md-24">favorite</i>
                <div className="today-title">
                    <span data-bind="if: !nodepath().person2">
                        <a href="#" data-bind="location: { page: 'node', path: nodepath().person1.path }, text: nodepath().person1.node.attributes.name"></a>
                        celebrates
                        <span data-bind="text: nodepath().person1.node.attributes.gender === 'm' ? 'his' : 'her'"></span>
                        <span data-bind="number: nodepath().years"></span> wedding anniversary
                    </span>
                    <span data-bind="if: nodepath().person2">
                        <a href="#" data-bind="location: { page: 'node', path: nodepath().person1.path }, text: nodepath().person1.node.attributes.name"></a>
                        and
                        <a href="#" data-bind="location: { page: 'node', path: nodepath().person2.path }, text: nodepath().person2.node.attributes.name"></a>
                        celebrates
                        their
                        <span data-bind="number: nodepath().years"></span> wedding anniversary
                    </span>
                </div>
            </div>

        );
    }
}

export default FeedWidgetTodayMarriage;
