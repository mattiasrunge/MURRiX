
/* global window */

import ko from "knockout";
import api from "api.io-client";
import stat from "lib/status";
import loc from "lib/location";
import format from "lib/format";
import utils from "lib/utils";
import session from "lib/session";
import moment from "moment";
import React from "react";
import PropTypes from "prop-types";
import LazyLoad from "react-lazy-load";
import Component from "lib/component";
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from "reactstrap";

class NodeSectionMedia extends Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            size: 226,
            days: [],
            dropdownOpen: false
        };
    }

    componentDidMount() {
        this.addDisposables([
            this.props.nodepath.subscribe(() => this.load())
        ]);

        this.load();
    }

    async load() {
        try {
            const nodepath = ko.unwrap(this.props.nodepath);
            const node = ko.unwrap(nodepath.node);

            if (!node) {
                return;
            }

            this.setState({ loading: true, days: [] });

            let texts = [];
            let files = [];
            const imageOpts = {
                width: this.state.size,
                height: this.state.size,
                type: "image"
            };

            if (node.properties.type === "a") {
                texts = await api.vfs.list(`${nodepath.path}/texts`, { noerror: true });
                files = await api.file.list(`${nodepath.path}/files`, { image: imageOpts });
            } else if (node.properties.type === "p") {
                files = await api.people.findByTags(nodepath.path, { image: imageOpts });
            } else {
                console.error("Don't know what data to load for this type", node, nodepath);
            }

            utils.sortNodeList(texts);
            utils.sortNodeList(files);

            session.list(files);

            console.log("files", files);
            console.log("texts", texts);

            let days = {};

            for (const text of texts) {
                text.name = "Unknown";

                try {
                    text.name = await api.auth.name(text.node.properties.birthuid);
                } catch (error) {
                    console.error("Could not resolve uid to name", error);
                }

                const day = text.node.attributes.time ? moment.utc(text.node.attributes.time.timestamp * 1000).format("YYYY-MM-DD") : "noday";

                days[day] = days[day] || { texts: [], files: [], time: text.node.attributes.time };
                days[day].texts.push(text);
            }

            for (const file of files) {
                const day = file.node.attributes.time ? moment.utc(file.node.attributes.time.timestamp * 1000).format("YYYY-MM-DD") : "noday";

                days[day] = days[day] || { texts: [], files: [], time: file.node.attributes.time };
                days[day].files.push(file);
            }

            days = Object.keys(days).map((key) => days[key]);

            days.sort((a, b) => {
                if (!a.time) {
                    return -1;
                } else if (!b.time) {
                    return 1;
                }

                return a.time.timestamp - b.time.timestamp;
            });

            console.log("days", days);

            this.setState({ days, loading: false });
        } catch (error) {
            stat.printError(error);
            this.setState({ days: [], loading: false });
        }
    }

    toggle(file) {
        if (file.node._id === this.state.dropdownOpen) {
            this.setState({ dropdownOpen: false });
        } else {
            this.setState({ dropdownOpen: file.node._id });
        }
    }

    onClick(event, file) {
        event.preventDefault();

        loc.goto({ showPath: file.path });
    }

    makeProfilePicture(file) {
        const abspath = ko.unwrap(this.props.nodepath).path;

        api.node.setProfilePicture(abspath, file.path)
            .then(() => {
                stat.printSuccess("Profile picture set");
            })
            .catch((error) => {
                stat.printError(error);
            });
    }

    download(file) {
        window.location = `file/download/${file.node.attributes.diskfilename}/${file.node.attributes.name}`;
    }

    rotate(file, angle) {
        api.file.rotate(file.path, angle)
            .then(() => {
                stat.printSuccess("Rotated successfully");
            })
            .catch((error) => {
                stat.printError(error);
            });
    }

    render() {
        return (
            <div className="clearfix">
                <If condition={this.state.loading}>
                    <div className="text-center" style={{ margin: 20 }}>
                        <i className="material-icons md-48 spin">cached</i>
                        <div>
                            <strong>Loading...</strong>
                        </div>
                    </div>
                </If>
                <For each="item" of={this.state.days}>
                    <div key={item.time ? item.time.timestamp : 0} style={{ marginLeft: 2, marginRight: 2, marginTop: 2 }}>
                        <div style={{ marginLeft: 13, marginRight: 13 }}>
                            <If condition={item.time && item.time.timestamp}>
                                <h3>
                                    {format.displayTimeDay(item.time)}
                                </h3>
                            </If>
                            <For each="text" of={item.texts}>
                                <blockquote key={text.node._id}>
                                    <p>
                                        {text.node.attributes.text}
                                    </p>
                                    <footer>
                                        Written by <cite title="By">{text.name}</cite> on {format.datetimeUtc(text.node.attributes.time.timestamp)}
                                    </footer>
                                </blockquote>
                            </For>
                        </div>

                        <div className="clearfix" style={{ marginRight: -1, marginBottom: -1 }}>
                            <For each="file" of={item.files}>
                                <LazyLoad
                                    key={file.node._id}
                                    className="float-left grid-picture-container"
                                    height={this.state.size + 1}
                                    width={this.state.size + 1}
                                    offsetVertical={this.state.size}
                                >
                                    <span
                                        style={{
                                            display: "inline-block",
                                            position: "relative",
                                            width: this.state.size,
                                            height: this.state.size
                                        }}
                                        className="grid-picture"
                                    >
                                        <img
                                            className="grid-picture"
                                            src={file.filename}
                                            title={file.node.attributes.name}
                                            onClick={(e) => this.onClick(e, file)}
                                        />

                                        <Dropdown
                                            className="grid-picture-menu"
                                            isOpen={this.state.dropdownOpen === file.node._id}
                                            toggle={() => this.toggle(file)}
                                        >
                                            <DropdownToggle
                                                className="grid-picture-menu-toggle"
                                            >
                                                <i
                                                    className="material-icons"
                                                    title="Menu"
                                                >
                                                    more_vert
                                                </i>
                                            </DropdownToggle>
                                            <DropdownMenu>
                                                <If condition={ko.unwrap(this.props.nodepath).editable}>
                                                    <DropdownItem onClick={() => this.makeProfilePicture(file)}>Make profile picture</DropdownItem>
                                                </If>
                                                <If condition={file.editable}>
                                                    <DropdownItem onClick={() => this.rotate(file, 90)}>Rotate left</DropdownItem>
                                                    <DropdownItem onClick={() => this.rotate(file, -90)}>Rotate right</DropdownItem>
                                                </If>
                                                <DropdownItem onClick={() => this.download(file)}>Download</DropdownItem>
                                            </DropdownMenu>
                                        </Dropdown>
                                        <Choose>
                                            <When condition={file.node.attributes.type === "image"}>
                                                <i className="material-icons grid-picture-type" title="Image file">camera_alt</i>
                                            </When>
                                            <When condition={file.node.attributes.type === "video"}>
                                                <i className="material-icons grid-picture-type" title="Video file">videocam</i>
                                            </When>
                                            <When condition={file.node.attributes.type === "audio"}>
                                                <i className="material-icons grid-picture-type" title="Audio file">mic</i>
                                            </When>
                                            <When condition={file.node.attributes.type === "document"}>
                                                <i className="material-icons grid-picture-type" title="Document file">description</i>
                                            </When>
                                            <Otherwise>
                                                <i className="material-icons grid-picture-type" title="Unknown file">attachment</i>
                                            </Otherwise>
                                        </Choose>
                                    </span>
                                </LazyLoad>
                            </For>
                        </div>
                    </div>
                </For>
            </div>
        );
    }
}

NodeSectionMedia.propTypes = {
    nodepath: PropTypes.func
};

export default NodeSectionMedia;
