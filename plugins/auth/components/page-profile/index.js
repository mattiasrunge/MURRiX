
import ko from "knockout";
import api from "api.io-client";
import session from "lib/session";
import ui from "lib/ui";
import stat from "lib/status";
import format from "lib/format";
import React from "react";
import Component from "lib/component";
import AuthWidgetEditUser from "plugins/auth/components/widget-edit-user";
import AuthWidgetListGroups from "plugins/auth/components/widget-list-groups";

class AuthPageProfile extends Component {
    constructor(props) {
        super(props);

        this.state = {
            groups: [],
            userinfo: ko.unwrap(session.userinfo)
        };
    }

    componentDidMount() {
        this.addDisposables([
            session.userinfo.subscribe((userinfo) => this.setState({ userinfo }))
        ]);

        ui.setTitle("Profile");

        this.load();
    }

    async load() {
        try {
            const groups = await api.auth.groupList(this.state.userinfo.username);

            console.log("groups", groups);

            this.setState({ groups });
        } catch (e) {
            console.error(e);
            stat.printError("Failed to get group list");
            this.setState({ groups: [] });
        }
    }

    render() {
        return (
            <div className="fadeInRight animated">
                <div className="page-header">
                    <h1>Profile</h1>
                </div>

                <If condition={!this.state.userinfo.user}>
                    Not logged in
                </If>
                <If condition={this.state.userinfo.user}>
                    <div className="row">
                        <div className="col-md-5" style={{ paddingRight: "0" }}>
                            <div className="box box-content" style={{ marginTop: "0", paddingBottom: "0" }}>
                                <AuthWidgetEditUser
                                    user={this.state.userinfo.user}
                                    username={this.state.userinfo.username}
                                    personPath={this.state.userinfo.personPath}
                                />
                            </div>
                        </div>
                        <div className="col-md-7">
                            <div className="box box-content" style={{ marginTop: "0", paddingBottom: "0" }}>
                                <h3>Properties</h3>
                                <table className="table table-striped" style={{ fontSize: "12px" }}>
                                    <tbody>
                                        <tr>
                                            <td><strong>Last login</strong></td>
                                            <td>
                                                {format.datetimeAgo(this.state.userinfo.user.attributes.loginTime)}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td><strong>Created</strong></td>
                                            <td>
                                                {format.datetimeAgo(this.state.userinfo.user.properties.birthtime)}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td><strong>Modified</strong></td>
                                            <td>
                                                {format.datetimeAgo(this.state.userinfo.user.properties.mtime)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>

                                <h3>Group memberships</h3>
                                <AuthWidgetListGroups
                                    list={this.state.groups}
                                />
                            </div>
                        </div>
                    </div>
                </If>
            </div>
        );
    }
}

export default AuthPageProfile;
