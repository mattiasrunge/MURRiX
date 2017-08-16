
import ko from "knockout";
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import format from "lib/format";
import NodeWidgetSections from "plugins/node/components/widget-sections";
import NodeWidgetHeader from "plugins/node/components/widget-header";
import CommentWidgetComments from "plugins/comment/components/widget-comments";
import NodeWidgetDescription from "plugins/node/components/widget-description";

class WidgetPage extends Component {
    render() {
        const nodepath = ko.unwrap(this.props.nodepath);

        return (
            ﻿<div>
                <If condition={nodepath}>
                    <div className="row">
                        <div className="col-md-9" style={{ paddingRight: 0 }}>
                            <NodeWidgetHeader
                                nodepath={this.props.nodepath}
                            />

                            <div className="node-widget-sections">
                                <NodeWidgetSections
                                    sections={this.props.sections}
                                    showShareSettings={nodepath.editable}
                                    showUpload={nodepath.editable}
                                    showMove={nodepath.editable}
                                    params={{ nodepath: this.props.nodepath }}
                                />
                            </div>
                        </div>
                        <div className="col-md-3 left-border node-sidebar">
                            <div className="node-sidebar-section">
                                <h4>Description</h4>
                                <NodeWidgetDescription
                                    nodepath={this.props.nodepath}
                                />
                            </div>

                            <div className="node-sidebar-section">
                                <h4>Information</h4>
                                <table className="table node-table text-muted">
                                    <tbody>
                                        <tr>
                                            <td><strong>Created</strong></td>
                                            <td>
                                                {format.datetimeAgo(ko.unwrap(nodepath.node).properties.birthtime)}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td><strong>Last modified</strong></td>
                                            <td>
                                                {format.datetimeAgo(ko.unwrap(nodepath.node).properties.mtime)}
                                            </td>
                                        </tr>
                                        <For each="item" of={this.props.information}>
                                            <tr>
                                                <td><strong>{item.name}</strong></td>
                                                <td>{item.value}</td>
                                            </tr>
                                        </For>
                                    </tbody>
                                </table>
                            </div>

                            <div className="node-sidebar-section">
                                <h4>Comments</h4>
                                <CommentWidgetComments
                                    path={nodepath.path}
                                />
                            </div>
                        </div>
                    </div>
                </If>
            </div>
        );
    }
}

WidgetPage.defaultProps = {
    information: []
};

WidgetPage.propTypes = {
    nodepath: PropTypes.func,
    sections: PropTypes.array.isRequired,
    information: PropTypes.array
};

export default WidgetPage;
