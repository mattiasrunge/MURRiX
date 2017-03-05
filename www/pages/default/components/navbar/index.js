
import React from "react";
import Knockout from "components/knockout";
import { Collapse, Navbar, NavbarToggler, NavbarBrand, Nav, NavItem, NavLink } from "reactstrap";
import { Button, Form, FormGroup, Label, Input } from "reactstrap";
import { Container, Row, Col } from "reactstrap";
import { NavDropdown, DropdownItem, DropdownToggle, DropdownMenu } from 'reactstrap';


const ko = require("knockout");
const api = require("api.io-client");
const stat = require("lib/status");
const session = require("lib/session");
const loc = require("lib/location");

class DefaultNavbar extends Knockout {
    /*constructor(props) {
        super(props);

        this.toggleStarMenu = this.toggleStarMenu.bind(this);
        this.toggleAddMenu = this.toggleAddMenu.bind(this);
        this.toggleProfileMenu = this.toggleProfileMenu.bind(this);

        this.state = {
            starMenuOpen: false,
            addMenuOpen: false,
            profileMenuOpen: false
        };
    }

    toggleStarMenu() {
        this.setState({
            starMenuOpen: !this.state.starMenuOpen
        });
    }

    toggleAddMenu() {
        this.setState({
            addMenuOpen: !this.state.addMenuOpen
        });
    }

    toggleProfileMenu() {
        this.setState({
            profileMenuOpen: !this.state.profileMenuOpen
        });
    }*/

    async getModel() {
        const model = {};

        model.loading = stat.loading;
        model.user = session.user;
        model.searchPaths = session.searchPaths;
        model.stars = ko.observableArray();
        model.loggedIn = session.loggedIn;
        model.createType = ko.observable("");
        model.createName = ko.observable("");
        model.createDescription = ko.observable("");
        model.showCreateModal = ko.observable(false);
        model.pathError = ko.observable(false);
        model.pathPermissionDenied = ko.pureComputed(() => model.pathError() && model.pathError().toString().includes("Permission denied"));
        model.needLogin = ko.pureComputed(() => model.pathPermissionDenied() && !session.loggedIn());
        model.path = ko.pureComputed({
            read: () => loc.current().page === "node" ? loc.current().path : "",
            write: (path) => {
                if (path) {
                    return loc.goto({ page: "node", path: path }, false);
                }

                if (model.needLogin()) {
                    return loc.goto({ page: "login" });
                }

                loc.goto({}, false);
            }
        });
        model.starred = ko.pureComputed(() => model.stars().filter((star) => star.path === model.path()).length > 0);

        const loadStars = () => {
            api.auth.getStars()
            .then(model.stars)
            .catch((error) => {
                stat.printError(error);
            });
        };

        let subscription = session.user.subscribe(loadStars);
        loadStars();

        model.toggleStar = () => {
            api.auth.toggleStar(model.path())
            .then((result) => {
                model.stars(result.stars);

                if (result.created) {
                    stat.printSuccess("Star created");
                } else {
                    stat.printSuccess("Star removed");
                }
            })
            .catch((error) => {
                stat.printError(error);
            });
        };

        model.random = () => {
            api.vfs.random([ "/albums" ], 1)
            .then((item) => {
                if (item) {
                    loc.goto({ page: "node", path: item.path }, false);
                } else {
                    stat.printError("No random node could be found");
                }
            });
        };

        model.createShow = (type) => {
            model.createType(type);
            model.createName("");
            model.createDescription("");
            model.showCreateModal(true);
        };

        model.create = () => {
            console.log("type", model.createType());
            console.log("name", model.createName());
            console.log("description", model.createDescription());

            let promise;
            let abspath = "";
            let attributes = {
                name: model.createName().trim(),
                description: model.createDescription().trim()
            };

            if (attributes.name === "") {
                stat.printError("Name can not be empty");
                return;
            }

            if (model.createType() === "album") {
                promise = api.node.getUniqueName("/albums", attributes.name)
                .then((name) => {
                    abspath = "/albums/" + name;
                    return api.album.mkalbum(name, attributes);
                });
            } else if (model.createType() === "location") {
                promise = api.node.getUniqueName("/locations", attributes.name)
                .then((name) => {
                    abspath = "/locations/" + name;
                    return api.location.mklocation(name, attributes);
                });
            } else if (model.createType() === "person") {
                promise = api.node.getUniqueName("/people", attributes.name)
                .then((name) => {
                    abspath = "/people/" + name;
                    return api.people.mkperson(name, attributes);
                });
            } else if (model.createType() === "camera") {
                promise = api.node.getUniqueName("/cameras", attributes.name)
                .then((name) => {
                    abspath = "/cameras/" + name;
                    return api.camera.mkcamera(name, attributes);
                });
            } else {
                stat.printError("Unknown create type");
                return;
            }

            promise
            .then(() => {
                model.createType("");
                model.createName("");
                model.createDescription("");
                model.showCreateModal(false);

                loc.goto({ page: "node", path: abspath }, false);

                stat.printSuccess(attributes.name + " successfully created!");
            })
            .catch((error) => {
                stat.printError(error);
            });
        };

        model.dispose = () => {
            subscription.dispose();
        };


        return model;
    }

    render2() {
        return (
            <Navbar
                fixed="top"
                inverse
                color="primary"
            >
                <Container>
                    <Row>
                        <NavbarBrand href="/">
                            <i className="material-icons md-20">home</i>
                        </NavbarBrand>
                        <Form inline style={{ marginRight: "auto" }}>
                            <Input type="text" placeholder="Search for anything" />
                        </Form>
                        <Nav inline>
                            <NavLink href="#" style={{ color: "white" }}>
                                <i className="material-icons md-20">explore</i>
                            </NavLink>
                            <NavDropdown

                                isOpen={this.state.starMenuOpen}
                                toggle={this.toggleStarMenu}
                            >
                                <DropdownToggle
                                    style={{ color: "white" }}
                                    nav
                                >
                                    <i className="material-icons md-20">star</i>
                                </DropdownToggle>
                                <DropdownMenu right>
                                    <DropdownItem header>Header</DropdownItem>
                                    <DropdownItem disabled>Action</DropdownItem>
                                    <DropdownItem>Another Action</DropdownItem>
                                    <DropdownItem divider />
                                    <DropdownItem>Another Action</DropdownItem>
                                </DropdownMenu>
                            </NavDropdown>
                            <NavDropdown

                                isOpen={this.state.addMenuOpen}
                                toggle={this.toggleAddMenu}
                            >
                                <DropdownToggle
                                    style={{ color: "white" }}
                                    nav
                                >
                                    <i className="material-icons md-20">add</i>
                                </DropdownToggle>
                                <DropdownMenu right>
                                    <DropdownItem>
                                        <i className="material-icons">photo_album</i>
                                        {" "}
                                        Album
                                    </DropdownItem>
                                    <DropdownItem>
                                        <i className="material-icons">person</i>
                                        {" "}
                                        Person
                                    </DropdownItem>
                                    <DropdownItem>
                                        <i className="material-icons">location_on</i>
                                        {" "}
                                        Location
                                    </DropdownItem>
                                    <DropdownItem>
                                        <i className="material-icons">photo_camera</i>
                                        {" "}
                                        Camera
                                    </DropdownItem>
                                </DropdownMenu>
                            </NavDropdown>
                            <NavDropdown
                                isOpen={this.state.profileMenuOpen}
                                toggle={this.toggleProfileMenu}
                            >
                                <DropdownToggle
                                    style={{ color: "white" }}
                                    nav
                                    caret
                                >
                                    Mattias Runge
                                </DropdownToggle>
                                <DropdownMenu right>
                                    <DropdownItem header>Header</DropdownItem>
                                    <DropdownItem disabled>Action</DropdownItem>
                                    <DropdownItem>Another Action</DropdownItem>
                                    <DropdownItem divider />
                                    <DropdownItem>Another Action</DropdownItem>
                                </DropdownMenu>
                            </NavDropdown>
                        </Nav>
                    </Row>
                </Container>
            </Navbar>
        );
    }

    getTemplate() {
        return (
            <div>

                <nav className="navbar fixed-top navbar-inverse navbar-background navbar-toggleable-md" role="navigation">
                    <div className="container">
                        <div className="row" style={{ width: "100%" }}>
                            <a className="navbar-brand" href="#" data-bind="tooltip: 'Go to start'" data-placement="bottom" data-trigger="hover">
                                <i className="material-icons md-20">home</i>
                            </a>

                            <form className="mr-auto header-search">
                                <input type="text" className="form-control" placeholder="Search for anything" data-bind="nodeselect: { root: searchPaths, path: path, error: pathError }"/>

                                <a className="star" href="#" data-bind=", attr: { title: starred() ? 'Click to unstar' : 'Click to star' }, click: toggleStar, visible: loggedIn() && path() !== '', tooltip: starred() ? 'Click to unstar' : 'Click to star'" data-placement="bottom" data-trigger="hover">
                                    <i className="material-icons md-24" data-bind="visible: starred">star</i>
                                    <i className="material-icons md-24" data-bind="visible: !starred()">star_border</i>
                                </a>
                            </form>

                            <ul className="navbar-nav" data-bind="visible: user() !== false">
                                <li className="nav-item">
                                    <a className="nav-link" href="#" data-bind="click: random, visible: loggedIn(), tooltip: 'Go to random'" data-placement="bottom" data-trigger="hover">
                                        <i className="material-icons md-20">explore</i>
                                    </a>
                                </li>
                            </ul>

                            <ul className="navbar-nav" data-bind="visible: user() !== false">
                                <li className="nav-item dropdown" data-bind="visible: stars().length > 0 && loggedIn()">
                                    <a className="nav-link" data-toggle="dropdown" href="#" data-bind="tooltip: 'Starred'" data-placement="bottom" data-trigger="hover">
                                        <i className="material-icons md-20">star</i>
                                    </a>
                                    <div className="dropdown-menu dropdown-menu-right" data-bind="foreach: stars">
                                        <a className="dropdown-item" href="#" data-bind="location: { page: 'node', path: $data.path, section: null }">
                                            <div style={{ display: "inline-block" }} data-bind="react: { name: 'file-widget-profile-picture', params: { size: 16, path: $data.path, nolazyload: true } }"></div>
                                            {"  "}
                                            <span data-bind="nodename: $data.path"></span>
                                        </a>
                                    </div>
                                </li>
                            </ul>

                            <ul className="navbar-nav" data-bind="visible: user() !== false">
                                <li className="nav-item dropdown" data-bind="visible: loggedIn">
                                    <a className="nav-link" title="Create" data-toggle="dropdown" href="#" data-bind="tooltip: 'Create'" data-placement="bottom" data-trigger="hover">
                                        <i className="material-icons md-20">add</i>
                                    </a>
                                    <div className="dropdown-menu dropdown-menu-right">
                                        <a className="dropdown-item" href="#" data-bind="click: createShow.bind($data, 'album')">
                                            <i className="material-icons">photo_album</i>
                                            {"  "}
                                            Album
                                        </a>
                                        <a className="dropdown-item" href="#" data-bind="click: createShow.bind($data, 'person')">
                                            <i className="material-icons">person</i>
                                            {"  "}
                                            Person
                                        </a>
                                        <a className="dropdown-item" href="#" data-bind="click: createShow.bind($data, 'location')">
                                            <i className="material-icons">location_on</i>
                                            {"  "}
                                            Location
                                        </a>
                                        <a className="dropdown-item" href="#" data-bind="click: createShow.bind($data, 'camera')">
                                            <i className="material-icons">photo_camera</i>
                                            {"  "}
                                            Camera
                                        </a>
                                    </div>
                                </li>
                            </ul>

                            <ul className="navbar-nav" data-bind="react: 'auth-widget-navbar-user'"></ul>
                        </div>
                    </div>
                </nav>

                <form data-bind="submit: create, moveToBody: true">
                    <div className="modal fade" id="createModal" tabIndex="-1" role="dialog" data-bind="modal: showCreateModal">
                        <div className="modal-dialog" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                                    <h4 className="modal-title">
                                        Create new <span data-bind="text: createType"></span>
                                    </h4>
                                </div>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label>Name</label>
                                        <input type="text" className="form-control" placeholder="Write a name" data-bind="textInput: createName" />
                                    </div>
                                    <div className="form-group">
                                        <label>Description</label>
                                        <textarea rows="6" className="form-control" placeholder="Write a description" data-bind="textInput: createDescription"></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" data-dismiss="modal">Close</button>
                                    <button type="submit" className="btn btn-primary">Create</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

        );
    }
}

export default DefaultNavbar;
