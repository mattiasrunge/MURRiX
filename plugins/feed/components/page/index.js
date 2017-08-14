
import moment from "moment";
import ui from "lib/ui";
import api from "api.io-client";
import React from "react";
import Component from "lib/component";
import stat from "lib/status";
import NodeWidgetType from "plugins/node/components/widget-type";
import AuthWidgetNameUser from "plugins/auth/components/widget-name-user";
import CommentWidgetComments from "plugins/comment/components/widget-comments";
import FeedWidgetNewsFile from "plugins/feed/components/widget-news-file";
import FeedWidgetNewsLocation from "plugins/feed/components/widget-news-location";
import FeedWidgetNewsAlbum from "plugins/feed/components/widget-news-album";
import FeedWidgetNewsPerson from "plugins/feed/components/widget-news-person";
import FeedWidgetTodayBirthday from "plugins/feed/components/widget-today-birthday";
import FeedWidgetTodayMarriage from "plugins/feed/components/widget-today-marriage";
import FeedWidgetTodayEngagement from "plugins/feed/components/widget-today-engagement";

class FeedPage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            todaysDate: moment(),
            tomorrowsDate: moment().add(1, "day"),
            todayList: [],
            tomorrowList: [],
            list: []
        };
    }

    componentDidMount() {
        ui.setTitle("News");

        const subscription = api.feed.on("new", (data) => {
            api.vfs.access(data.path, "r")
                .then((readable) => {
                    if (readable) {
                        const list = this.state.list.slice(0);

                        list.unshift({
                            name: data.name,
                            path: data.path,
                            node: data.node
                        });

                        this.setState({ list });
                    }
                })
                .catch((error) => {
                    console.error(error);
                });
        });

        this.addDisposable({
            dispose: () => api.feed.off(subscription)
        });

        this.load();
    }

    async load() {
        const todaysDate = moment();
        const tomorrowsDate = todaysDate.clone().add(1, "day");
        let todayList = [];
        let tomorrowList = [];
        let list = [];

        try {
            todayList = await api.feed.eventThisDay(todaysDate.format("YYYY-MM-DD"));
        } catch (error) {
            stat.printError(error);
        }

        try {
            tomorrowList = await api.feed.eventThisDay(tomorrowsDate.format("YYYY-MM-DD"));
        } catch (error) {
            stat.printError(error);
        }

        try {
            list = await api.feed.list();
        } catch (error) {
            stat.printError(error);
        }

        this.setState({ todaysDate, tomorrowsDate, todayList, tomorrowList, list });
    }

    render() {
        return (
            <div className="fadeInRight animated">
                <div className="row">
                    <div className="col-md-7" style={{ paddingRight: "0" }}>
                        <div className="news-container">
                            <For each="item" of={this.state.list}>
                                <div className="news-item" key={item.node._id}>
                                    <div className="news-title">
                                        <If condition={item.node.attributes.action === "comment"}>
                                            New comments were made on
                                        </If>
                                        <If condition={item.node.attributes.action === "created"}>
                                            <strong><AuthWidgetNameUser uid={item.node.attributes.uid} /></strong> added a new
                                        </If>
                                        {" "}
                                        <strong><NodeWidgetType type={item.node.attributes.type} /></strong>
                                    </div>
                                    <Choose>
                                        <When condition={item.node.attributes.type === "f"}>
                                            <FeedWidgetNewsFile
                                                nodepath={item}
                                            />
                                        </When>
                                        <When condition={item.node.attributes.type === "a"}>
                                            <FeedWidgetNewsAlbum
                                                nodepath={item}
                                            />
                                        </When>
                                        <When condition={item.node.attributes.type === "l"}>
                                            <FeedWidgetNewsLocation
                                                nodepath={item}
                                            />
                                        </When>
                                        <When condition={item.node.attributes.type === "p"}>
                                            <FeedWidgetNewsPerson
                                                nodepath={item}
                                            />
                                        </When>
                                    </Choose>

                                    <div className="news-comments">
                                        <CommentWidgetComments
                                            path={item.node.attributes.path}
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            </For>
                        </div>
                    </div>
                    <div className="col-md-5">
                        <div className="today-container">
                            <div className="today-header">
                                Today
                            </div>

                            <For each="item" of={this.state.todayList}>
                                <div className="today-item" key={item.node._id}>
                                    <Choose>
                                        <When condition={item.type === "birthday"}>
                                            <FeedWidgetTodayBirthday
                                                nodepath={item}
                                            />
                                        </When>
                                        <When condition={item.type === "marriage"}>
                                            <FeedWidgetTodayMarriage
                                                nodepath={item}
                                            />
                                        </When>
                                        <When condition={item.type === "engagement"}>
                                            <FeedWidgetTodayEngagement
                                                nodepath={item}
                                            />
                                        </When>
                                    </Choose>
                                </div>
                            </For>
                            <If condition={this.state.todayList.length === 0}>
                                <p className="text-muted">
                                    No events found
                                </p>
                            </If>
                        </div>

                        <div className="today-container">
                            <div className="today-header">
                                Tomorrow
                            </div>
                            <For each="item" of={this.state.tomorrowList}>
                                <div className="today-item" key={item.node._id}>
                                    <Choose>
                                        <When condition={item.type === "birthday"}>
                                            <FeedWidgetTodayBirthday
                                                nodepath={item}
                                            />
                                        </When>
                                        <When condition={item.type === "marriage"}>
                                            <FeedWidgetTodayMarriage
                                                nodepath={item}
                                            />
                                        </When>
                                        <When condition={item.type === "engagement"}>
                                            <FeedWidgetTodayEngagement
                                                nodepath={item}
                                            />
                                        </When>
                                    </Choose>
                                </div>
                            </For>
                            <If condition={this.state.tomorrowList.length === 0}>
                                <p className="text-muted">
                                    No events found
                                </p>
                            </If>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default FeedPage;
