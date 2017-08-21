
import ko from "knockout";
import api from "api.io-client";
import stat from "lib/status";
import utils from "lib/utils";
import React from "react";
import PropTypes from "prop-types";
import LazyLoad from "react-lazy-load";
import Component from "lib/component";
import NodeWidgetNodeSelect from "plugins/node/components/widget-node-select";
import { Button } from "reactstrap";

class NodeSectionMove extends Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            size: 50,
            files: [],
            selected: [],
            path: ""
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
        try {
            const node = ko.unwrap(nodepath.node);

            if (!node) {
                return;
            }

            this.setState({ loading: true, files: [], selected: [] });

            const imageOpts = {
                width: this.state.size,
                height: this.state.size,
                type: "image"
            };
            const files = await api.file.list(`${nodepath.path}/files`, { image: imageOpts });

            utils.sortNodeList(files);

            console.log("files", files);

            this.setState({ files, loading: false });
        } catch (error) {
            stat.printError(error);
            this.setState({ files: [], loading: false });
        }
    }

    onClick(event, file) {
        event.preventDefault();

        const selected = this.state.selected;
        const index = selected.indexOf(file);

        if (index === -1) {
            selected.push(file);
        } else {
            selected.splice(index, 1);
        }

        this.setState({ selected: selected.slice(0) });
    }

    selectAll() {
        if (this.state.files.length === this.state.selected.length) {
            this.setState({ selected: [] });
        } else {
            this.setState({ selected: this.state.files.slice(0) });
        }
    }

    selectTarget(nodepath) {
        this.setState({ path: nodepath ? nodepath.path : "" });
    }

    async move() {
        try {
            for (const file of this.state.selected) {
                await api.vfs.move(file.path, `${this.state.path}/files`);
            }

            await this.load();
        } catch (error) {
            console.error(error);
        }
    }

    render() {
        return (
            <div className="fadeInDown animated node-content" style={{ position: "relative" }}>
                <div style={{ position: "absolute", right: "0", top: "0", zIndex: "5" }} data-bind="visible: fileInput().length > 0">
                    <table style={{ display: "inline-block" }}>
                        <tbody>
                            <tr>
                                <td style={{ width: 300 }}>
                                    <NodeWidgetNodeSelect
                                        root={[ "/albums" ]}
                                        placeholder="Select target album"
                                        path={this.state.path}
                                        onSelect={(t) => this.selectTarget(t)}
                                    />
                                </td>
                                <td>
                                    <Button
                                        color="primary"
                                        onClick={() => this.move()}
                                        disabled={this.state.path === "" || this.state.selected.length === 0}
                                    >
                                        Move
                                    </Button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <h3>
                    Move files
                    <Button
                        color="link"
                        onClick={() => this.selectAll()}
                    >
                        <Choose>
                            <When condition={this.state.files.length === this.state.selected.length}>
                                Deselect all
                            </When>
                            <Otherwise>
                                Select all
                            </Otherwise>
                        </Choose>
                    </Button>
                </h3>

                <div className="clearfix">
                    <If condition={this.state.loading}>
                        <div className="text-center" style={{ margin: 20 }}>
                            <i className="material-icons md-48 spin">cached</i>
                            <div>
                                <strong>Loading...</strong>
                            </div>
                        </div>
                    </If>
                    <div style={{ marginLeft: 2, marginRight: 2, marginTop: 2 }}>
                        <div className="clearfix" style={{ marginRight: -1, marginBottom: -1 }}>
                            <For each="file" of={this.state.files}>
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
                                        title={file.node.attributes.name}
                                        onClick={(e) => this.onClick(e, file)}
                                        className="grid-picture"
                                    >
                                        <If condition={file.filename}>
                                            <img
                                                className={`grid-picture ${this.state.selected.includes(file) ? "grid-picture-selected" : ""}`}
                                                src={file.filename}
                                            />
                                        </If>
                                        <If condition={this.state.selected.includes(file)}>
                                            <i
                                                className="material-icons grid-picture-check"
                                            >
                                                check
                                            </i>
                                        </If>
                                    </span>
                                </LazyLoad>
                            </For>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

NodeSectionMove.propTypes = {
    nodepath: PropTypes.object.isRequired
};

export default NodeSectionMove;
