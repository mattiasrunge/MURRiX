
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import { AsyncTypeahead } from "react-bootstrap-typeahead";
import api from "api.io-client";
import stat from "lib/status";

class WidgetNodeSelect extends Component {
    constructor(props) {
        super(props);

        this.state = {
            options: [],
            selected: []
        };
    }

    load(props) {
        if (props.path) {
            api.vfs.resolve(props.path, { noerror: true, nodepath: true })
            .then((item) => {
                this.setState({
                    options: [ item ],
                    selected: [ item ]
                });
            });
        } else {
            this.setState({
                options: [],
                selected: []
            });
        }
    }

    componentWillReceiveProps(nextProps) {
        this.load(nextProps);
    }

    componentDidMount() {
        this.load(this.props);
    }

    onSearch(query) {
        const nameFilter = { $regex: `.*${query}.*`, $options: "-i" };

        api.vfs.list(this.props.root, {
            filter: {
                "attributes.name": nameFilter
            },
            limit: this.props.limit
        })
        .then((list) => {
            return Promise.all(list.map((nodepath) => {
                return api.vfs.resolve(`${nodepath.path}/profilePicture`, { noerror: true })
                .then((node) => {
                    if (node) {
                        return api.file.getMediaUrl(node._id, {
                            width: 16,
                            height: 16,
                            type: "image"
                        });
                    }

                    return false;
                })
                .then((filename) => {
                    nodepath.filename = filename;

                    return nodepath;
                })
                .catch((error) => {
                    stat.printError(error);

                    return nodepath;
                });
            }));
        })
        .then((list) => {
            this.setState({ options: list });
        });
    }

    render() {
        return (
            <AsyncTypeahead
                placeholder="Search for anything"
                className={this.state.selected[0] ? "valid" : ""}
                options={this.state.options}
                selected={this.state.selected}
                labelKey={(item) => item.node.attributes.name}
                maxResults={this.props.limit}
                onSearch={(query) => this.onSearch(query)}
                onBlur={() => {
                    if (!this.state.selected[0]) {
                        this.props.onSelect(null);
                    }
                }}
                onChange={(selectedItems) => {
                    if (selectedItems[0] !== this.state.selected[0]) {
                        this.setState({
                            selected: selectedItems
                        });

                        if (selectedItems[0]) {
                            this.props.onSelect(selectedItems[0]);
                        }
                    }

                    return true;
                }}
                renderMenuItemChildren={(result) => {
                    if (!result.filename) {
                        return result.node.attributes.name;
                    }

                    return (
                        <div>
                            <img
                                src={result.filename}
                                style={{
                                    width: 16,
                                    height: 16,
                                    marginRight: 5
                                }}
                            />
                            <span>
                                {result.node.attributes.name}
                            </span>
                        </div>
                    );
                }}
            />
        );
    }
}

WidgetNodeSelect.defaultProps = {
    limit: 10
};

WidgetNodeSelect.propTypes = {
    root: PropTypes.array,
    limit: PropTypes.number,
    path: PropTypes.string,
    onSelect: PropTypes.func
};

export default WidgetNodeSelect;
