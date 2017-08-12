
import ko from "knockout";
import api from "api.io-client";
import stat from "lib/status";
import session from "lib/session";
import loc from "lib/location";
import React from "react";
import Component from "lib/component";
import { Navbar, NavbarBrand, Nav, NavLink, Container, Row } from "reactstrap";
import NodeWidgetNodeSelect from "plugins/node/components/widget-node-select";
import NodeWidgetNavbarNodeCreate from "plugins/node/components/widget-navbar-node-create";
import AuthWidgetNavbarUser from "plugins/auth/components/widget-navbar-user";
import AuthWidgetNavbarStars from "plugins/auth/components/widget-navbar-stars";
import AuthWidgetNodeStar from "plugins/auth/components/widget-node-star";

class DefaultNavbar extends Component {
    constructor(props) {
        super(props);

        this.state = {
            page: ko.unwrap(loc.current().page) || "default",
            path: ko.unwrap(loc.current().path),
            loggedIn: ko.unwrap(session.loggedIn)
        };
    }

    componentDidMount() {
        this.addDisposables([
            loc.current.subscribe((current) => this.setState({
                page: current.page || "default",
                path: current.path
            })),
            session.loggedIn.subscribe((loggedIn) => this.setState({ loggedIn }))
        ]);
    }

    random() {
        api.vfs.random([ "/albums" ], this.state.path ? [ this.state.path ] : [])
            .then((item) => {
                if (item) {
                    loc.goto({ page: "node", path: item.path }, false);
                } else {
                    stat.printError("No random node could be found");
                }
            });
    }

    goto(node) {
        if (node) {
            loc.goto({ page: "node", path: node.path }, false);
        } else {
            loc.goto({ page: null }, false);
        }
    }

    render() {
        return (
            <Navbar
                fixed="top"
                inverse
            >
                <Container>
                    <Row>
                        <NavbarBrand href="#">
                            <i className="material-icons md-24">home</i>
                        </NavbarBrand>
                        <div className="header-search mr-auto">
                            <NodeWidgetNodeSelect
                                root={session.searchPaths()}
                                path={this.state.page === "node" ? this.state.path : null }
                                onSelect={(node) => this.goto(node)}
                            />
                            <AuthWidgetNodeStar />
                        </div>
                        <Nav>
                            <If condition={this.state.loggedIn}>
                                <NavLink
                                    href="#"
                                    onClick={() => this.random()}
                                    style={{ color: "white" }}
                                >
                                    <i className="material-icons md-24">explore</i>
                                </NavLink>
                            </If>

                            <AuthWidgetNavbarStars />

                            <NodeWidgetNavbarNodeCreate />

                            <AuthWidgetNavbarUser />
                        </Nav>
                    </Row>
                </Container>
            </Navbar>
        );
    }
}

export default DefaultNavbar;
