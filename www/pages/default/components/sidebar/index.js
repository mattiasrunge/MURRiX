
import React from "react";
import Knockout from "components/knockout";
import Comment from "components/comment";

const ko = require("knockout");
const loc = require("lib/location");
const session = require("lib/session");

class DefaultSidebar extends Knockout {
    async getModel() {
        const model = {};

        model.user = session.user;
        model.loggedIn = session.loggedIn;
        model.page = ko.pureComputed(() => ko.unwrap(loc.current().page) || "default");


        return model;
    }

    getTemplate() {
        return (
            <div>
                <div data-bind="react: 'auth-widget-sidebar-user'"></div>

                <ul className="nav nav-pills nav-stacked" data-bind="visible: loggedIn, if: loggedIn">
                    <li className="header">Explore</li>
                    <li data-bind="css: { active: page() === 'news' || page() === 'default' }">
                        <a data-bind="location: { page: null }">
                            <i className="material-icons md-18">home</i>
                            News
                        </a>
                    </li>
                    <li data-bind="css: { active: page() === 'search' }">
                        <a data-bind="location: { page: 'search' }">
                            <i className="material-icons md-18">search</i>
                            Search by name
                        </a>
                    </li>
                    <li data-bind="css: { active: page() === 'year' }">
                        <a data-bind="location: { page: 'year' }">
                            <i className="material-icons md-18">date_range</i>
                            Search by year
                        </a>
                    </li>
                    <li data-bind="css: { active: page() === 'labels' }">
                        <a data-bind="location: { page: 'labels' }">
                            <i className="material-icons md-18">label</i>
                            Browse by label
                        </a>
                    </li>

                    <li className="header">Numbers</li>
                    <li data-bind="css: { active: page() === 'charts' }">
                        <a data-bind="location: { page: 'charts' }">
                            <i className="material-icons md-18">show_chart</i>
                            Charts
                        </a>
                    </li>
                </ul>
            </div>

        );
    }
}

export default DefaultSidebar;
