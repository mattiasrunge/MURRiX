
import React from "react";
import Component from "lib/component";
import { NavDropdown, DropdownItem, DropdownToggle, DropdownMenu, Button, Modal, ModalHeader, ModalBody, ModalFooter, Input } from "reactstrap";

const ko = require("knockout");
const api = require("api.io-client");
const stat = require("lib/status");
const session = require("lib/session");
const loc = require("lib/location");
const $ = require("jquery");

class NodeWidgetNavbarNodeCreate extends Component {
    constructor(props) {
        super(props);

        this.toggleMenu = this.toggleMenu.bind(this);

        this.state = {
            menuOpen: false,
            modalOpen: false,
            type: false,
            name: "",
            loggedIn: ko.unwrap(session.loggedIn)
        };
    }

    componentDidMount() {
        this.addDisposables([
            session.loggedIn.subscribe((loggedIn) => this.setState({ loggedIn }))
        ]);
    }

    toggleMenu() {
        this.setState({
            menuOpen: !this.state.menuOpen
        });
    }

    closeModal() {
        this.setState({
            modalOpen: false,
            type: false,
            name: ""
        });
    }

    openModal(type) {
        this.setState({
            modalOpen: true,
            type: type
        });

        // This is hacky but don't know how to get the bootstrap event for opened
        setTimeout(() => {
            $("#modalCreateInput").focus();
        }, 500);
    }

    setName(event) {
        this.setState({ name: event.target.value });
    }

    async create(event) {
        event.preventDefault();

        if (this.state.name === "") {
            return;
        }

        console.log("create", this.state.type, this.state.name);

        const attributes = {
            name: this.state.name.trim(),
            description: ""
        };

        const typeInfoList = {
            album: {
                path: "/albums",
                makefn: api.album.mkalbum
            },
            location: {
                path: "/locations",
                makefn: api.location.mklocation
            },
            person: {
                path: "/people",
                makefn: api.people.mkperson
            },
            camera: {
                path: "/cameras",
                makefn: api.camera.mkcamera
            }
        };

        const typeInfo = typeInfoList[this.state.type];

        try {
            const name = await api.vfs.uniqueName(typeInfo.path, attributes.name);

            await typeInfo.makefn(name, attributes);

            stat.printSuccess(`${attributes.name} successfully created!`);
            this.closeModal();

            loc.goto({ page: "node", path: `${typeInfo.path}/${name}` }, false);
        } catch (error) {
            stat.printError(error);
        }
    }

    render() {
        return (
            <span>
                <If condition={this.state.loggedIn}>
                    <Modal
                        isOpen={this.state.modalOpen}
                        toggle={() => this.closeModal()}
                    >
                        <ModalHeader toggle={() => this.closeModal()}>
                            Create new {this.state.type}
                        </ModalHeader>
                        <ModalBody>
                            <form onSubmit={(e) => this.create(e)}>
                                <Input
                                    id="modalCreateInput"
                                    placeholder="Write a name"
                                    type="text"
                                    value={this.state.value}
                                    onChange={(e) => this.setName(e)}
                                />
                            </form>
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                color="secondary"
                                onClick={() => this.closeModal()}
                            >
                                Cancel
                            </Button>
                            {" "}
                            <Button
                                color="primary"
                                onClick={(e) => this.create(e)}
                                disabled={this.state.name === ""}
                            >
                                Create
                            </Button>
                        </ModalFooter>
                    </Modal>
                    <NavDropdown
                        isOpen={this.state.menuOpen}
                        toggle={this.toggleMenu}
                    >
                        <DropdownToggle
                            style={{ color: "white" }}
                            nav
                        >
                            <i className="material-icons md-24">add</i>
                        </DropdownToggle>
                        <DropdownMenu right>
                            <DropdownItem
                                onClick={() => this.openModal("album")}
                            >
                                <i className="material-icons">photo_album</i>
                                {" "}
                                Album
                            </DropdownItem>
                            <DropdownItem
                                onClick={() => this.openModal("person")}
                            >
                                <i className="material-icons">person</i>
                                {" "}
                                Person
                            </DropdownItem>
                            <DropdownItem
                                onClick={() => this.openModal("location")}
                            >
                                <i className="material-icons">location_on</i>
                                {" "}
                                Location
                            </DropdownItem>
                            <DropdownItem
                                onClick={() => this.openModal("camera")}
                            >
                                <i className="material-icons">photo_camera</i>
                                {" "}
                                Camera
                            </DropdownItem>
                        </DropdownMenu>
                    </NavDropdown>
                </If>
            </span>
        );
    }
}

export default NodeWidgetNavbarNodeCreate;
