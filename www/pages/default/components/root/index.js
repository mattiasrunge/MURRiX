
import ko from "knockout";
import loc from "lib/location";
import session from "lib/session";
import stat from "lib/status";
import React from "react";
import Component from "lib/component";
import Navbar from "components/navbar";
import Sidebar from "components/sidebar";
import Fullscreen from "plugins/node/components/fullscreen";
import PageFeed from "plugins/feed/components/page";
import PageSearch from "plugins/search/components/page-search";
import PageYear from "plugins/search/components/page-year";
import PageLabels from "plugins/search/components/page-labels";
import PageCharts from "plugins/statistics/components/page-charts";
import PageLogin from "plugins/auth/components/page-login";
import PageProfile from "plugins/auth/components/page-profile";
import PageReset from "plugins/auth/components/page-reset";
import PageNode from "plugins/node/components/page";
import Terminal from "components/terminal";
import Notification from "components/notification";

class DefaultRoot extends Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: stat.loading(),
            loggedIn: session.loggedIn(),
            page: ko.unwrap(loc.current().page) || "default",
            showPath: ko.unwrap(loc.current().showPath),
            list: session.list
        };
    }

    componentDidMount() {
        this.addDisposables([
            stat.loading.subscribe((loading) => this.setState({ loading })),
            session.loggedIn.subscribe((loggedIn) => this.setState({ loggedIn })),
            loc.current.subscribe((current) => this.setState({
                page: current.page || "default",
                showPath: current.showPath
            })),
            session.list.subscribe((list) => this.setState({ list }))
        ]);
    }

    render() {
        return (
            <div>
                <If condition={this.state.loading}>
                    <div className="loader"></div>
                </If>

                <Navbar />

                <If condition={this.state.showPath}>
                    <Fullscreen
                        list={session.list}
                    />
                </If>

                <Terminal />

                <Notification />

                <div className="page-container">
                    <div className="container">
                        <div className="row">
                            <Choose>
                                <When condition={this.state.page !== "node"}>
                                    <div style={{ width: "100%" }}>
                                        <Choose>
                                            <When condition={this.state.loggedIn}>
                                                <div className="col-2 sidebar">
                                                    <Sidebar />
                                                </div>
                                                <div className="col-10 main">
                                                    <Choose>
                                                        <When condition={this.state.page === "news" || this.state.page === "default"}>
                                                            <PageFeed />
                                                        </When>
                                                        <When condition={this.state.page === "search"}>
                                                            <PageSearch />
                                                        </When>
                                                        <When condition={this.state.page === "year"}>
                                                            <PageYear />
                                                        </When>
                                                        <When condition={this.state.page === "labels"}>
                                                            <PageLabels />
                                                        </When>
                                                        <When condition={this.state.page === "charts"}>
                                                            <PageCharts />
                                                        </When>
                                                        <When condition={this.state.page === "login"}>
                                                            <PageLogin />
                                                        </When>
                                                        <When condition={this.state.page === "profile"}>
                                                            <PageProfile />
                                                        </When>
                                                        <When condition={this.state.page === "reset"}>
                                                            <PageReset />
                                                        </When>
                                                    </Choose>
                                                </div>
                                            </When>
                                            <Otherwise>
                                                <div className="col-md-12">
                                                    <Choose>
                                                        <When condition={this.state.page === "reset"}>
                                                            <PageReset />
                                                        </When>
                                                        <Otherwise>
                                                            <PageLogin />
                                                        </Otherwise>
                                                    </Choose>
                                                </div>
                                            </Otherwise>
                                        </Choose>
                                    </div>
                                </When>
                                <Otherwise>
                                    <div className="col-md-12 page-node">
                                        <PageNode />
                                    </div>
                                </Otherwise>
                            </Choose>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default DefaultRoot;
