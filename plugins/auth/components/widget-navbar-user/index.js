
import React from "react";
import Component from "lib/component";
import { NavDropdown, NavLink, DropdownItem, DropdownToggle, DropdownMenu } from "reactstrap";
import AuthWidgetPictureUser from "plugins/auth/components/widget-picture-user";

const ko = require("knockout");
const api = require("api.io-client");
const stat = require("lib/status");
const session = require("lib/session");
const loc = require("lib/location");

class AuthWidgetNavbarUser extends Component {
    constructor(props) {
        super(props);

        this.toggleMenu = this.toggleMenu.bind(this);

        this.state = {
            menuOpen: false,
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

    toggleMenu() {
        this.setState({
            menuOpen: !this.state.menuOpen
        });
    }

    async logout() {
        try {
            await api.auth.logout();
            await session.loadUser();
            stat.printSuccess("Logout successfull");
        } catch (e) {
            console.error(e);
            stat.printError("Logout failed");
        }
    }

    gotoLogin(event) {
        event.preventDefault();

        loc.goto({ page: "login" });
    }

    render() {
        return (
            <span>
                <Choose>
                    <When condition={this.state.loggedIn}>
                        <NavDropdown
                            isOpen={this.state.menuOpen}
                            toggle={this.toggleMenu}
                        >
                            <DropdownToggle
                                style={{ color: "white" }}
                                nav
                                caret
                            >
                                <span className="picture">
                                    <AuthWidgetPictureUser
                                        size={20}
                                        uid={this.state.user.attributes.uid}
                                        classes="rounded-circle"
                                    />
                                </span>
                                {this.state.user.attributes.name}
                            </DropdownToggle>
                            <DropdownMenu right>
                                <DropdownItem
                                    onClick={() => loc.goto({ page: "profile" }, false)}
                                >
                                    <i className="material-icons">account_box</i>
                                    {"  "}
                                    Profile
                                </DropdownItem>
                                <If condition={this.state.personPath}>
                                    <DropdownItem
                                        onClick={() => loc.goto({ page: "node", path: this.state.personPath }, false)}
                                    >
                                        <i className="material-icons">person</i>
                                        {"  "}
                                        Me
                                    </DropdownItem>
                                </If>
                                <DropdownItem divider />
                                <DropdownItem
                                    onClick={() => this.logout()}
                                >
                                    <i className="material-icons">exit_to_app</i>
                                    {"  "}
                                    Logout
                                </DropdownItem>
                            </DropdownMenu>
                        </NavDropdown>
                    </When>
                    <Otherwise>
                        <NavLink
                            href="#"
                            onClick={(e) => this.gotoLogin(e)}
                            style={{ color: "white" }}
                        >
                            <i className="material-icons md-18">account_circle</i>
                            {"  "}
                            Login
                        </NavLink>
                    </Otherwise>
                </Choose>
            </span>
        );
    }
}

export default AuthWidgetNavbarUser;
