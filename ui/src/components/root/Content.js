
import React, { Fragment } from "react";
import { Route, Switch, Redirect } from "react-router-dom";
import { NotificationContainer } from "react-notifications";
import session from "lib/session";
import Component from "lib/component";
import { Navbar } from "components/navbar";
import { Terminal } from "components/terminal";
import { Notification } from "components/notification";
import { JobsContainer } from "components/jobs";
import { Home } from "components/home";
import { Node } from "components/node";
import { User } from "components/user";
import { Organize } from "components/organize";
import { SignIn, Reset } from "components/authentication";
import { UploadProgress } from "components/upload";
import theme from "./theme.module.css";

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
                <NotificationContainer />
                <Navbar />
                <JobsContainer />
                <UploadProgress />

                <div className={theme.rootContainer}>
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
                                    path="/node/*"
                                    render={(props) => (
                                        <Node {...props} />
                                    )}
                                />
                                <Route
                                    path={"/user"}
                                    render={(props) => (
                                        <User {...props} />
                                    )}
                                />
                                <Route
                                    path="/home"
                                    render={(props) => (
                                        <Home {...props} />
                                    )}
                                />
                                <Route
                                    path="/organize"
                                    render={(props) => (
                                        <Organize {...props} />
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
                </div>
            </Fragment>
        );
    }
}

export default Content;
