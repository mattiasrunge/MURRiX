
import React from "react";
import ko from "knockout";
import PropTypes from "prop-types";
import Component from "lib/component";
import FileWidgetProfilePicture from "plugins/file/components/widget-profile-picture";
import NodeWidgetTextAttribute from "plugins/node/components/widget-text-attribute";
import NodeWidgetLabels from "plugins/node/components/widget-labels";

class NodeWidgetHeader extends Component {
    constructor(props) {
        super(props);

        this.state = {
            path: ko.unwrap(props.nodepath).path
        };
    }

    componentDidMount() {
        this.addDisposables([
            this.props.nodepath.subscribe((np) => this.setState({ path: np.path }))
        ]);
    }

    render() {
        return (
            ﻿<div className="node-header" style={{ display: "table" }}>
                <FileWidgetProfilePicture
                    renderOverride={(url) => (
                        <div
                            className="node-header-background"
                            style={{ backgroundImage: `url('${url}')` }}
                        ></div>
                    )}
                    size="150"
                    path={this.state.path}
                />

                <div style={{ display: "table-cell", padding: 0, verticalAlign: "bottom" }}>
                    <div className="node-header-picture">
                        <FileWidgetProfilePicture
                            size="150"
                            path={this.state.path}
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
    nodepath: PropTypes.func
};

export default NodeWidgetHeader;
