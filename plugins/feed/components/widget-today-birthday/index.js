
import React from "react";
import Knockout from "components/knockout";
import Comment from "components/comment";

const ko = require("knockout");
const utils = require("lib/utils");

class FeedWidgetTodayBirthday extends Knockout {
    async getModel() {
        const model = {};

        model.nodepath = ko.pureComputed(() => ko.unwrap(this.props.nodepath));


        return model;
    }

    getTemplate() {
        return (
            <div>
                <i className="material-icons md-24">cake</i>
                <div className="today-title">
                    <a href="#" data-bind="location: { page: 'node', path: nodepath().person.path }, text: nodepath().person.node.attributes.name"></a>
                    <span data-bind="if: nodepath().ageAtDeath === false">
                        <span> celebrates </span>
                        <span data-bind="text: nodepath().person.node.attributes.gender === 'm' ? 'his' : 'her'"></span>
                        <span> </span>
                        <span data-bind="number: nodepath().ageNow"></span>
                        <span> birthday</span>
                    </span>
                    <span data-bind="if: nodepath().ageAtDeath !== false">
                        <span> would have celebrated </span>
                        <span data-bind="text: nodepath().person.node.attributes.gender === 'm' ? 'his' : 'her'"></span>
                        <span> </span>
                        <span data-bind="number: nodepath().ageNow"></span>
                        <span> birthday (died age <span data-bind="text: nodepath().ageAtDeath"></span>)</span>
                    </span>
                </div>
            </div>

        );
    }
}

export default FeedWidgetTodayBirthday;
