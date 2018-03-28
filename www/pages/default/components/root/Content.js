
import React, { Fragment } from "react";
import PropTypes from "prop-types";
import session from "lib/session";
import { Route, Switch, Redirect } from "react-router-dom";
import Component from "lib/component";
import { Navbar } from "components/navbar";
import { Terminal } from "components/terminal";
import { Notification } from "components/notification";
import { Home } from "components/home";
import { Node } from "components/node";
import { SignIn, Reset, Profile } from "components/authentication";

class Content extends Component {
    constructor(props) {
        super(props);

        this.state = {
            user: session.user()
        };
    }

    async load() {
        this.addDisposable(session.on("update", (event, user) => this.setState({ user })));
    }

    render() {
        return (
            <Fragment>
                <Terminal />
                <Notification />
                <Navbar location={this.props.location} />

                <Switch>
                    <Route
                        path="/reset"
                        render={(props) => (
                            <Reset {...props} />
                        )}
                    />
                    <Choose>
                        <When condition={!this.state.user || this.state.user.name === "guest"}>
                            <Route
                                path="*"
                                render={(props) => (
                                    <SignIn {...props} />
                                )}
                            />
                        </When>
                        <Otherwise>
                            <Route
                                path="/profile"
                                render={(props) => (
                                    <Profile {...props} />
                                )}
                            />
                            <Route
                                path="/node/*"
                                render={(props) => (
                                    <Node {...props} />
                                )}
                            />
                            <Route
                                path="/home"
                                render={(props) => (
                                    <Home {...props} />
                                )}
                            />
                            <Route
                                path="*"
                                render={() => (
                                    <Redirect
                                        to={{ pathname: "/home" }}
                                    />
                                )}
                            />
                        </Otherwise>
                    </Choose>
                </Switch>
            </Fragment>
        );

        // return (
        //     <div>
        //         <If condition={this.state.loading}>
        //             <div className="loader"></div>
        //         </If>
        //
        //
        //
        //         <If condition={this.state.showPath}>
        //             <Fullscreen
        //                 list={session.list}
        //             />
        //         </If>
        //
        //         <Terminal />
        //
        //         <Notification />
        //
        //         <div className="page-container">
        //             <div className="container">
        //                 <div className="row">
        //                     <If condition={this.state.page !== "node"}>
        //                         <Choose>
        //                             <When condition={this.state.loggedIn}>
        //                                 <div className="col-md-2 sidebar">
        //                                     <Sidebar />
        //                                 </div>
        //                                 <div className="col-md-10 main">
        //                                     <Choose>
        //                                         <When condition={this.state.page === "news" || this.state.page === "default"}>
        //                                             <PageFeed />
        //                                         </When>
        //                                         <When condition={this.state.page === "search"}>
        //                                             <PageSearch />
        //                                         </When>
        //                                         <When condition={this.state.page === "name"}>
        //                                             <PageName />
        //                                         </When>
        //                                         <When condition={this.state.page === "year"}>
        //                                             <PageYear />
        //                                         </When>
        //                                         <When condition={this.state.page === "labels"}>
        //                                             <PageLabels />
        //                                         </When>
        //                                         <When condition={this.state.page === "charts"}>
        //                                             <PageCharts />
        //                                         </When>
        //                                         <When condition={this.state.page === "login"}>
        //                                             <PageLogin />
        //                                         </When>
        //                                         <When condition={this.state.page === "profile"}>
        //                                             <PageProfile />
        //                                         </When>
        //                                         <When condition={this.state.page === "reset"}>
        //                                             <PageReset />
        //                                         </When>
        //                                     </Choose>
        //                                 </div>
        //                             </When>
        //                             <Otherwise>
        //                                 <div className="col-md-12">
        //                                     <Choose>
        //                                         <When condition={this.state.page === "reset"}>
        //                                             <PageReset />
        //                                         </When>
        //                                         <Otherwise>
        //                                             <PageLogin />
        //                                         </Otherwise>
        //                                     </Choose>
        //                                 </div>
        //                             </Otherwise>
        //                         </Choose>
        //                     </If>
        //                     <If condition={this.state.page === "node" && this.state.path}>
        //                         <div className="col-md-12 page-node">
        //                             <PageNode path={this.state.path} />
        //                         </div>
        //                     </If>
        //                 </div>
        //             </div>
        //         </div>
        //     </div>
        // );
    }
}

Content.propTypes = {
    location: PropTypes.object.isRequired
};

Content.contextTypes = {
    router: PropTypes.object.isRequired
};

export default Content;
