
/* global window */

import api from "api.io-client";
import stat from "lib/status";
import utils from "lib/utils";
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";

class NodeSectionFiles extends Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            files: []
        };
    }

    componentDidMount() {
        this.load(this.props.nodepath);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.nodepath !== this.props.nodepath) {
            this.load(nextProps.nodepath);
        }
    }

    async load(nodepath) {
        if (!nodepath) {
            this.setState({ loading: false, files: [] });
        }

        try {
            this.setState({ loading: true, files: [] });

            const files = await api.vfs.list(`${nodepath.path}/extra`, { noerror: true });

            console.log("unsorted files", files);

            utils.sortNodeList(files);

            console.log("files", files);

            this.setState({ files, loading: false });
        } catch (error) {
            stat.printError(error);
            this.setState({ files: [], loading: false });
        }
    }

    download(file) {
        window.location = `file/download/${file.node.attributes.diskfilename}/${file.node.attributes.name}`;
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
                <table className="table table-striped table-hover table-condensed" style={{ width: "100%", marginBottom: "0" }}>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Type</th>
                            <th style={{ width: "100px" }}>Size</th>
                        </tr>
                    </thead>
                    <tbody>
                        <For each="item" of={this.state.files}>
                            <tr key={item.node._id}>
                                <td>
                                    <a
                                        href="#"
                                        onClick={() => this.download(item)}
                                    >
                                        {item.node.attributes.name}
                                    </a>
                                </td>
                                <td>
                                    {item.node.attributes.mimetype}
                                </td>
                                <td>
                                    {item.node.attributes.size}
                                </td>
                            </tr>
                        </For>
                    </tbody>
                </table>
            </div>
        );
    }
}

NodeSectionFiles.propTypes = {
    nodepath: PropTypes.object.isRequired
};

export default NodeSectionFiles;
