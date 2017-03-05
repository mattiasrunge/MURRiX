
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

                <ul className="nav nav-pills flex-column" data-bind="visible: loggedIn, if: loggedIn">
                    <li className="header">Explore</li>
                    <li data-bind="css: { active: page() === 'news' || page() === 'default' }">
                        <a className="nav-link" data-bind="location: { page: null }">
                            <i className="material-icons md-18">home</i>
                            <span> News</span>
                        </a>
                    </li>
                    <li data-bind="css: { active: page() === 'search' }">
                        <a className="nav-link" data-bind="location: { page: 'search' }">
                            <i className="material-icons md-18">search</i>
                            <span> Search by name</span>
                        </a>
                    </li>
                    <li data-bind="css: { active: page() === 'year' }">
                        <a className="nav-link" data-bind="location: { page: 'year' }">
                            <i className="material-icons md-18">date_range</i>
                            <span> Search by year</span>
                        </a>
                    </li>
                    <li data-bind="css: { active: page() === 'labels' }">
                        <a className="nav-link" data-bind="location: { page: 'labels' }">
                            <i className="material-icons md-18">label</i>
                            <span> Browse by label</span>
                        </a>
                    </li>

                    <li className="header">Numbers</li>
                    <li data-bind="css: { active: page() === 'charts' }">
                        <a className="nav-link" data-bind="location: { page: 'charts' }">
                            <i className="material-icons md-18">show_chart</i>
                            <span> Charts</span>
                        </a>
                    </li>
                </ul>
            </div>

        );
    }
}

export default DefaultSidebar;
