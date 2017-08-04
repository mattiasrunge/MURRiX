
import loc from "lib/location";
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import FileWidgetProfilePicture from "plugins/file/components/widget-profile-picture";

class NodeWidgetCard extends Component {
    onClick(event) {
        event.preventDefault();
        loc.goto({ page: "node", path: this.props.nodepath.path, section: null });
    }

    render() {
        return (
            <div
                className={`node-item-panel ${this.props.className}`}
                style={{ width: "296px" }}
                onClick={(e) => this.onClick(e)}
            >
                <If condition={this.props.nodepath}>
                    <div style={{ position: "relative", height: "303px" }}>
                        <FileWidgetProfilePicture
                            size="303"
                            path={this.props.nodepath.path}
                            nodepath={this.props.nodepath}
                        />

                        <div className="title-text">
                            <i className="material-icons md-18">
                                <Choose>
                                    <When condition={this.props.nodepath.node.properties.type === "a"}>
                                        photo_album
                                    </When>
                                    <When condition={this.props.nodepath.node.properties.type === "p"}>
                                        person
                                    </When>
                                    <When condition={this.props.nodepath.node.properties.type === "l"}>
                                        location_on
                                    </When>
                                    <When condition={this.props.nodepath.node.properties.type === "c"}>
                                        photo_camera
                                    </When>
                                </Choose>
                            </i>
                            {" "}
                            {this.props.nodepath.node.attributes.fullname ? this.props.nodepath.node.attributes.fullname : this.props.nodepath.node.attributes.name}
                        </div>
                    </div>
                    <div style={{ padding: "15px" }}>
                        ﻿<p className="node-widget-description">
                            {this.props.nodepath.node.attributes.description}
                        </p>
                        <div className="node-widget-labels">
                            <For each="item" of={this.props.nodepath.node.attributes.labels}>
                                <span
                                    key={item}
                                    className="badge badge-primary"
                                    style={{ marginRight: "5px", marginBottom: "5px" }}
                                >
                                    {item}
                                </span>
                            </For>
                        </div>
                    </div>
                </If>
            </div>
        );
    }
}

NodeWidgetCard.defaultProps = {
    className: ""
};

NodeWidgetCard.propTypes = {
    className: PropTypes.string,
    nodepath: PropTypes.object
};

export default NodeWidgetCard;
