
import ko from "knockout";
import api from "api.io-client";
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import stat from "lib/status";
import format from "lib/format";
import NodeWidgetSections from "plugins/node/components/widget-sections";
import NodeWidgetHeader from "plugins/node/components/widget-header";

class AlbumPage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            count: 0
        };
    }

    componentDidMount() {
        this.addDisposables([
            this.props.nodepath.subscribe((np) => this.load(np))
        ]);

        this.load(ko.unwrap(this.props.nodepath));
    }

    async load(nodepath) {
        if (!nodepath) {
            return this.setState({ count: 0 });
        }

        try {
            const node = await api.vfs.resolve(`${nodepath.path}/files`);

            if (!node) {
                return this.setState({ count: 0 });
            }

            this.setState({ count: node.properties.children.length });
        } catch (error) {
            stat.printError(error);
            this.setState({ count: 0 });
        }
    }

    render() {
        const nodepath = ko.unwrap(this.props.nodepath);

        return (
            ﻿<div>
                <If condition={nodepath}>
                    <div className="row node-header" style={{ marginTop: "15px" }}>
                        <div className="col-md-8">
                            <NodeWidgetHeader
                                nodepath={this.props.nodepath}
                            />
                        </div>
                        <div className="col-md-4 left-border">
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
                                    <tr>
                                        <td><strong>Number of files</strong></td>
                                        <td>
                                            {this.state.count}
                                        </td>
                                    </tr>
                                    {/*  <tr>
                                        <td><strong>Download files</strong></td>
                                        <td>
                                            <a href="#" data-bind="text: nodepath().node().attributes.name.replace(" ", "_") + ".zip""></a> (size) <-- TODO
                                        </td>
                                    </tr> */}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="node-widget-sections">
                        <NodeWidgetSections
                            sections={[
                                {
                                    name: "media",
                                    icon: "photo_library",
                                    title: "Media",
                                    react: "node-section-media"
                                }
                            ]}
                            showShareSettings={nodepath.editable}
                            showUpload={nodepath.editable}
                            showMove={nodepath.editable}
                            params={{ nodepath: this.props.nodepath }}
                        />
                    </div>
                </If>
            </div>
        );
    }
}

AlbumPage.propTypes = {
    nodepath: PropTypes.func
};

export default AlbumPage;
