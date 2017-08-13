
import React from "react";
import Component from "lib/component";
import AuthWidgetPictureUser from "plugins/auth/components/widget-picture-user";
import ko from "knockout";
import session from "lib/session";
import loc from "lib/location";

class AuthWidgetSidebarUser extends Component {
    constructor(props) {
        super(props);

        this.state = {
            user: ko.unwrap(session.user),
            loggedIn: ko.unwrap(session.loggedIn),
            personPath: ko.unwrap(session.personPath)
        };
    }

    componentDidMount() {
        this.addDisposables([
            session.user.subscribe((user) => this.setState({ user })),
            session.loggedIn.subscribe((loggedIn) => this.setState({ loggedIn })),
            session.personPath.subscribe((personPath) => this.setState({ personPath }))
        ]);
    }

    onProfile(event) {
        event.preventDefault();
        loc.goto({ page: "profile" }, false);
    }

    onMe(event) {
        event.preventDefault();
        loc.goto({ page: "node", path: this.state.personPath }, false);
    }

    render() {
        return (
            <div className="profile">
                <If condition={this.state.loggedIn}>
                    <AuthWidgetPictureUser
                        size={36}
                        uid={this.state.user.attributes.uid}
                        classes="rounded-circle picture float-left"
                    />
                    <div style={{ marginLeft: 46 }}>
                        <div className="name">{this.state.user.attributes.name}</div>
                        <div>
                            <a
                                href="#"
                                onClick={(e) => this.onProfile(e)}
                            >
                                Profile
                            </a>
                            <If condition={this.state.personPath}>
                                &nbsp;&nbsp;&bull;&nbsp;&nbsp;
                                <a
                                    href="#"
                                    onClick={(e) => this.onMe(e)}
                                >
                                    Me
                                </a>
                            </If>
                        </div>
                    </div>
                </If>
            </div>
        );
    }
}

export default AuthWidgetSidebarUser;
