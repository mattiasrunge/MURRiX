
import React from "react";
import Component from "lib/component";
import { NavDropdown, DropdownItem, DropdownToggle, DropdownMenu } from "reactstrap";

const ko = require("knockout");
const api = require("api.io-client");
const stat = require("lib/status");
const session = require("lib/session");
const loc = require("lib/location");

class AuthWidgetNavbarStars extends Component {
    constructor(props) {
        super(props);

        this.toggleMenu = this.toggleMenu.bind(this);

        this.state = {
            menuOpen: false,
            stars: []
        };
    }

    componentDidMount() {
        this.addDisposables([
            session.stars.subscribe((stars) => this.load(stars))
        ]);

        this.load(ko.unwrap(session.stars));
    }

    async load(stars) {
        try {
            const list = [];

            for (const star of stars) {
                const node = await api.vfs.resolve(star.path, { noerror: true, nodepath: true });
                const profileNode = await api.vfs.resolve(`${node.path}/profilePicture`, { noerror: true });

                if (profileNode) {
                    node.filename = await api.file.getMediaUrl(profileNode._id, {
                        width: 16,
                        height: 16,
                        type: "image"
                    })
                    .catch((error) => {
                        stat.printError(error);
                    });
                }

                list.push(node);
            }

            this.setState({ stars: list });
        } catch (e) {
            this.setStars([]);
            stat.printError(e);
        }
    }

    toggleMenu() {
        this.setState({
            menuOpen: !this.state.menuOpen
        });
    }

    render() {
        return (
            <span>
                <If condition={this.state.stars.length > 0}>
                    <NavDropdown
                        isOpen={this.state.menuOpen}
                        toggle={this.toggleMenu}
                    >
                        <DropdownToggle
                            style={{ color: "white" }}
                            nav
                        >
                            <i className="material-icons md-24">star</i>
                        </DropdownToggle>
                        <DropdownMenu right>
                            <For each="item" of={this.state.stars}>
                                <DropdownItem
                                    key={item.path}
                                    onClick={() => loc.goto({ page: "node", path: item.path }, false)}
                                >
                                    <If condition={item.filename}>
                                        <img
                                            src={item.filename}
                                            style={{
                                                width: 16,
                                                height: 16,
                                                marginRight: 5
                                            }}
                                        />
                                    </If>
                                    <span>
                                        {item.node.attributes.name}
                                    </span>
                                </DropdownItem>
                            </For>
                        </DropdownMenu>
                    </NavDropdown>
                </If>
            </span>
        );
    }
}

export default AuthWidgetNavbarStars;
