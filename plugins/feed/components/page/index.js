
import React from "react";
import Knockout from "components/knockout";
import Comment from "components/comment";

const ko = require("knockout");
const moment = require("moment");
const api = require("api.io-client");
const utils = require("lib/utils");
const ui = require("lib/ui");
const stat = require("lib/status");

class FeedPage extends Knockout {
    async getModel() {
        const model = {};

        ui.setTitle("News");

        model.today = ko.observable(moment());
        model.tomorrow = ko.pureComputed(() => model.today().clone().add(1, "day"));
        model.loading = stat.create();
        model.list = ko.observableArray();
        model.eventsToday = ko.asyncComputed([], async () => {
            model.loading(true);
            let result = await api.feed.eventThisDay(model.today().format("YYYY-MM-DD"));
            model.loading(false);

            console.log(result);

            return result.map((item) => {
                item.node = ko.observable(item.node);
                return item;
            });
        }, (error) => {
            model.loading(false);
            stat.printError(error);
            return [];
        });

        model.eventsTomorrow = ko.asyncComputed([], async () => {
            model.loading(true);
            let result = await api.feed.eventThisDay(model.tomorrow().format("YYYY-MM-DD"));
            model.loading(false);

            console.log(result);

            return result.map((item) => {
                item.node = ko.observable(item.node);
                return item;
            });
        }, (error) => {
            model.loading(false);
            stat.printError(error);
            return [];
        });

        model.nextDay = () => {
            model.today().add(1, "day");
            model.today.valueHasMutated();
        };

        model.prevDay = () => {
            model.today().subtract(1, "day");
            model.today.valueHasMutated();
        };

        model.loading(true);
        let list = await api.feed.list();
        model.loading(false);

        console.log("news", list);

        let filtered = [];
        for (let item of list) {
            let readable = await api.vfs.access(item.node.attributes.path, "r");

            if (readable) {
                item.node = ko.observable(item.node);
                filtered.push(item);
            }
        }

        model.list(filtered);

        let subscription = api.feed.on("new", (data) => {
            api.vfs.access(data.path, "r")
            .then((readable) => {
                if (readable) {
                    model.list.unshift({
                        name: data.name,
                        path: data.path,
                        node: ko.observable(data.node)
                    });
                }
            })
            .catch((error) => {
                console.error(error);
            });
        });

        model.dispose = () => {
            api.feed.off(subscription);
            stat.destroy(model.loading);
        };


        return model;
    }

    getTemplate() {
        return (
            <div className="fadeInRight animated">
                <div className="row">
                    <div className="col-md-7" style={{ paddingRight: "0" }}>
                        <div className="news-container" data-bind="foreach: list">
                            <div className="news-item">
                                <div className="news-title">
                                    <span data-bind="if: $data.node().attributes.action === 'comment'">
                                        New comments were made on <strong data-bind="react: { name: 'node-widget-type', params: { type: $data.node().attributes.type } }"></strong>
                                    </span>
                                    <span data-bind="if: $data.node().attributes.action === 'created'">
                                        <strong data-bind="unameNice: $data.node().attributes.uid"></strong> added a new <strong data-bind="react: { name: 'node-widget-type', params: { type: $data.node().attributes.type } }"></strong>
                                    </span>
                                </div>

                                <div data-bind="if: $data.node().attributes.type === 'f'">
                                    <div data-bind="react: { name: 'feed-widget-news-file', params: { nodepath: $data } }"></div>
                                </div>
                                <div data-bind="if: $data.node().attributes.type === 'a'">
                                    <div data-bind="react: { name: 'feed-widget-news-album', params: { nodepath: $data } }"></div>
                                </div>
                                <div data-bind="if: $data.node().attributes.type === 'l'">
                                    <div data-bind="react: { name: 'feed-widget-news-location', params: { nodepath: $data } }"></div>
                                </div>
                                <div data-bind="if: $data.node().attributes.type === 'p'">
                                    <div data-bind="react: { name: 'feed-widget-news-person', params: { nodepath: $data } }"></div>
                                </div>

                                <div className="news-comments">
                                    <div data-bind="react: { name: 'comment-widget-comments', params: { path: $data.node().attributes.path, rows: 3 } }"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-5">
                        <div className="today-container">
                            <div className="today-header" data-bind="datetimeDayString: today().unix()"></div>

                            <div data-bind="foreach: eventsToday">
                                <div className="today-item">
                                    <div data-bind="if: $data.type === 'birthday'">
                                        <div data-bind="react: { name: 'feed-widget-today-birthday', params: { nodepath: $data } }"></div>
                                    </div>
                                    <div data-bind="if: $data.type === 'marriage'">
                                        <div data-bind="react: { name: 'feed-widget-today-marriage', params: { nodepath: $data } }"></div>
                                    </div>
                                    <div data-bind="if: $data.type === 'engagement'">
                                        <div data-bind="react: { name: 'feed-widget-today-engagement', params: { nodepath: $data } }"></div>
                                    </div>
                                </div>
                            </div>
                            <div data-bind="visible: eventsToday().length === 0">
                                <p className="text-muted">
                                    No events found
                                </p>
                            </div>
                        </div>

                        <div className="today-container">
                            <div className="today-header" data-bind="datetimeDayString: tomorrow().unix()"></div>
                            <div data-bind="foreach: eventsTomorrow">
                                <div className="today-item">
                                    <div data-bind="if: $data.type === 'birthday'">
                                        <div data-bind="react: { name: 'feed-widget-today-birthday', params: { nodepath: $data } }"></div>
                                    </div>
                                    <div data-bind="if: $data.type === 'marriage'">
                                        <div data-bind="react: { name: 'feed-widget-today-marriage', params: { nodepath: $data } }"></div>
                                    </div>
                                    <div data-bind="if: $data.type === 'engagement'">
                                        <div data-bind="react: { name: 'feed-widget-today-engagement', params: { nodepath: $data } }"></div>
                                    </div>
                                </div>
                            </div>
                            <div data-bind="visible: eventsTomorrow().length === 0">
                                <p className="text-muted">
                                    No events found
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        );
    }
}

export default FeedPage;
