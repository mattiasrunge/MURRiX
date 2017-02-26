
import React from "react";
import Knockout from "components/knockout";
import Comment from "components/comment";

const ko = require("knockout");
const loc = require("lib/location");
const session = require("lib/session");
const stat = require("lib/status");

class DefaultRoot extends Knockout {
    async getModel() {
        const model = {};

        model.loading = stat.loading;
        model.loggedIn = session.loggedIn;
        model.page = ko.pureComputed(() => ko.unwrap(loc.current().page) || "default");
        model.showPath = ko.pureComputed(() => ko.unwrap(loc.current().showPath));
        model.list = session.list;


        return model;
    }

    getTemplate() {
        return (
            <div>
                <div className="loader" data-bind="visible: loading"></div>
                <div data-bind="react: 'default-navbar'"></div>

                <div data-bind="if: showPath">
                    <div data-bind="react: { name: 'node-fullscreen', params: { showPath: showPath, list: list } }"></div>
                </div>

                <div className="page-container" data-bind="lazyload: true">
                    <div className="container">
                        <div className="row" data-bind="if: page() !== 'node', visible: page() !== 'node'">
                            <div data-bind="if: loggedIn">
                                <div className="col-md-2 sidebar">
                                    <div data-bind="if: page() !== 'node'">
                                        <div data-bind="react: 'default-sidebar'"></div>
                                    </div>
                                </div>
                                <div className="col-md-10 main">
                                    <div data-bind="if: page() === 'news' || page() === 'default'">
                                        <div data-bind="react: 'feed-page'"></div>
                                    </div>
                                    <div data-bind="if: page() === 'search'">
                                        <div data-bind="react: 'search-page-search'"></div>
                                    </div>
                                    <div data-bind="if: page() === 'year'">
                                        <div data-bind="react: 'search-page-year'"></div>
                                    </div>
                                    <div data-bind="if: page() === 'labels'">
                                        <div data-bind="react: 'search-page-labels'"></div>
                                    </div>
                                    <div data-bind="if: page() === 'charts'">
                                        <div data-bind="react: 'statistics-page-charts'"></div>
                                    </div>
                                    <div data-bind="if: page() === 'login'">
                                        <div data-bind="react: 'auth-page-login'"></div>
                                    </div>
                                    <div data-bind="if: page() === 'profile'">
                                        <div data-bind="react: 'auth-page-profile'"></div>
                                    </div>
                                    <div data-bind="if: page() === 'reset'">
                                        <div data-bind="react: 'auth-page-reset'"></div>
                                    </div>
                                </div>
                            </div>
                            <div data-bind="if: !loggedIn()">
                                <div className="col-md-12">
                                    <div data-bind="if: page() === 'reset'">
                                        <div data-bind="react: 'auth-page-reset'"></div>
                                    </div>
                                    <div data-bind="if: page() !== 'reset'">
                                        <div data-bind="react: 'auth-page-login'"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="row" data-bind="if: page() === 'node', visible: page() === 'node'">
                            <div className="col-md-12 page-node">
                                <div data-bind="react: 'node-page'"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        );
    }
}

export default DefaultRoot;
