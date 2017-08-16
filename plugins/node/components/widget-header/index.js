
import React from "react";
import ko from "knockout";
import PropTypes from "prop-types";
import Component from "lib/component";
import loc from "lib/location";
import FileWidgetProfilePicture from "plugins/file/components/widget-profile-picture";
import NodeWidgetTextAttribute from "plugins/node/components/widget-text-attribute";
import NodeWidgetLabels from "plugins/node/components/widget-labels";

class NodeWidgetHeader extends Component {
    constructor(props) {
        super(props);

        this.state = {
            nodepath: ko.unwrap(props.nodepath),
            dropdownOpen: false
        };
    }

    componentDidMount() {
        this.addDisposables([
            this.props.nodepath.subscribe((nodepath) => this.setState({ nodepath }))
        ]);
    }

    toggle() {
        this.setState({ dropdownOpen: !this.state.dropdownOpen });
    }

    onClick(event, section) {
        event.preventDefault();

        loc.goto({ section });
    }

    render() {
        const node = this.state.nodepath ? ko.unwrap(this.state.nodepath.node) : false;

        return (
            ﻿<div className="node-header" style={{ display: "table" }}>
                <If condition={this.state.nodepath.editable}>
                    <div className="node-header-menu">
                        <If condition={node && node.properties.type === "a"}>
                            <a
                                href="#"
                                title="Move files"
                                onClick={(e) => this.onClick(e, "move")}
                            >
                                <i className="material-icons md-24">folder</i>
                            </a>
                            <a
                                href="#"
                                title="Upload files"
                                onClick={(e) => this.onClick(e, "upload")}
                            >
                                <i className="material-icons md-24">file_upload</i>
                            </a>
                        </If>
                        <a
                            href="#"
                            title="Share settings"
                            onClick={(e) => this.onClick(e, "share")}
                        >
                            <i className="material-icons md-24">share</i>
                        </a>
                    </div>
                </If>
                <FileWidgetProfilePicture
                    renderOverride={(url) => (
                        <div
                            className="node-header-background"
                            style={{ backgroundImage: `url('${url}')` }}
                        ></div>
                    )}
                    size="150"
                    path={this.state.nodepath.path}
                />

                <div style={{ display: "table-cell", padding: 0, verticalAlign: "bottom" }}>
                    <div className="node-header-type">
                        <If condition={node && node.properties.type === "a"}>
                            <i className="material-icons">photo_album</i>
                        </If>
                        <If condition={node && node.properties.type === "l"}>
                            <i className="material-icons">location_on</i>
                        </If>
                        <If condition={node && node.properties.type === "p"}>
                            <i className="material-icons">person</i>
                        </If>
                        <If condition={node && node.properties.type === "c"}>
                            <i className="material-icons">photo_camera</i>
                        </If>
                    </div>
                    <div className="node-header-picture">
                        <FileWidgetProfilePicture
                            size="150"
                            path={this.state.nodepath.path}
                        />
                    </div>
                    <div className="node-header-title">
                        <NodeWidgetLabels
                            nodepath={this.props.nodepath}
                        />
                        <div className="node-header-name">
                            <NodeWidgetTextAttribute
                                nodepath={this.props.nodepath}
                                name="name"
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

NodeWidgetHeader.propTypes = {
    nodepath: PropTypes.func,
    sections: PropTypes.array
};

export default NodeWidgetHeader;
