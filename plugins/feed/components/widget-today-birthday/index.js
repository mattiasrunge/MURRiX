
import React from "react";
import Knockout from "components/knockout";

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
                        celebrates
                        <span data-bind="text: nodepath().person.node.attributes.gender === 'm' ? 'his' : 'her'"></span>
                        <span data-bind="number: nodepath().ageNow"></span> birthday
                    </span>
                    <span data-bind="if: nodepath().ageAtDeath !== false">
                        would have celebrated
                        <span data-bind="text: nodepath().person.node.attributes.gender === 'm' ? 'his' : 'her'"></span>
                        <span data-bind="number: nodepath().ageNow"></span> birthday (died age <span data-bind="text: nodepath().ageAtDeath"></span>)
                    </span>
                </div>
            </div>

        );
    }
}

export default FeedWidgetTodayBirthday;
