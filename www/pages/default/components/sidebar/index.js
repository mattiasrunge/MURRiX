
import ko from "knockout";
import loc from "lib/location";
import session from "lib/session";
import React from "react";
import Component from "lib/component";
import AuthWidgetSidebarUser from "plugins/auth/components/widget-sidebar-user";

class DefaultSidebar extends Component {
    constructor(props) {
        super(props);

        this.state = {
            user: session.user(),
            loggedIn: session.loggedIn(),
            page: ko.unwrap(loc.current().page) || "default"
        };
    }

    componentDidMount() {
        this.addDisposables([
            session.user.subscribe((user) => this.setState({ user })),
            session.loggedIn.subscribe((loggedIn) => this.setState({ loggedIn })),
            loc.current.subscribe((current) => this.setState({
                page: current.page || "default"
            }))
        ]);
    }

    gotoPage(event, page) {
        event.preventDefault();
        event.stopPropagation();

        loc.goto({ page });
    }

    render() {
        return (
            <div>
                <AuthWidgetSidebarUser />

                <If condition={this.state.loggedIn}>
                    <ul className="nav nav-pills flex-column">
                        <li className="header">Explore</li>
                        <li className={this.state.page === "news" || this.state.page === "default" ? "active" : ""}>
                            <a
                                className="nav-link"
                                onClick={(e) => this.gotoPage(e, null)}
                                href="#"
                            >
                                <i className="material-icons md-18">home</i>
                                <span> News</span>
                            </a>
                        </li>
                        <li className={this.state.page === "search" ? "active" : ""}>
                            <a
                                className="nav-link"
                                onClick={(e) => this.gotoPage(e, "search")}
                                href="#"
                            >
                                <i className="material-icons md-18">search</i>
                                <span> Search by name</span>
                            </a>
                        </li>
                        <li className={this.state.page === "year" ? "active" : ""}>
                            <a
                                className="nav-link"
                                onClick={(e) => this.gotoPage(e, "year")}
                                href="#"
                            >
                                <i className="material-icons md-18">date_range</i>
                                <span> Search by year</span>
                            </a>
                        </li>
                        <li className={this.state.page === "labels" ? "active" : ""}>
                            <a
                                className="nav-link"
                                onClick={(e) => this.gotoPage(e, "labels")}
                                href="#"
                            >
                                <i className="material-icons md-18">label</i>
                                <span> Browse by label</span>
                            </a>
                        </li>

                        <li className="header">Numbers</li>
                        <li className={this.state.page === "charts" ? "active" : ""}>
                            <a
                                className="nav-link"
                                onClick={(e) => this.gotoPage(e, "charts")}
                                href="#"
                            >
                                <i className="material-icons md-18">show_chart</i>
                                <span> Charts</span>
                            </a>
                        </li>
                    </ul>
                </If>
            </div>
        );
    }
}

export default DefaultSidebar;
