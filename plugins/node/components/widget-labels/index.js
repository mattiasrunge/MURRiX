
import ko from "knockout";
import stat from "lib/status";
import loc from "lib/location";
import api from "api.io-client";
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import { Badge, Input } from "reactstrap";

class NodeWidgetLabels extends Component {
    constructor(props) {
        super(props);

        const labels = this.getLabels(props.nodepath);

        this.state = {
            loading: false,
            editing: false,
            editable: ko.unwrap(props.nodepath).editable,
            labels: labels.list,
            labelString: labels.string
        };
    }

    componentDidMount() {
        if (ko.isObservable(this.props.nodepath)) {
            this.addDisposables([
                this.props.nodepath.subscribe((nodepath) => {
                    const labels = this.getLabels(nodepath);

                    this.setState({
                        labels: labels.list,
                        labelString: labels.string,
                        editable: ko.unwrap(nodepath).editable
                    });
                })
            ]);
        }
    }

    componentWillReceiveProps(nextProps) {
        const labels = this.getLabels(nextProps.nodepath);

        this.setState({
            labels: labels.list,
            labelString: labels.string,
            editable: ko.unwrap(nextProps.nodepath).editable
        });
    }

    getLabels(nodepath) {
        const np = ko.unwrap(nodepath);

        if (!np) {
            return {
                list: [],
                string: ""
            };
        }

        const node = ko.unwrap(np.node);

        if (!node) {
            return {
                list: [],
                string: ""
            };
        }

        const labels = node.attributes.labels || [];

        return {
            list: labels,
            string: labels.filter((l) => l).join(" ")
        };
    }

    async save() {
        const labels = this.getLabels(this.props.nodepath);
        const labelString = this.state.labelString.replace(/ +(?= )/g, "").replace(/(^[\s]+|[\s]+$)/g, "");

        if (labelString === labels.string) {
            return this.setState({ editing: false, labelString: labels.string });
        }

        try {
            console.log(`Saving attribute labels, old value was ""${labels.string}", new value is "${labelString}"`);

            const attributes = {
                labels: this.state.labelString.split(" ").filter((l) => l)
            };

            const node = await api.vfs.setattributes(ko.unwrap(this.props.nodepath).path, attributes);

            console.log("Saving attribute labels successfull!", node);

            this.setState({ editing: false, labels: attributes.labels });
        } catch (error) {
            stat.printError(error);
        }
    }

    onClick(event, label) {
        event.preventDefault();

        loc.goto({ page: "labels", query: label });
    }

    onEdit(event) {
        event.preventDefault();

        this.setState({ editing: true });
    }

    onKeyPress(event) {
        try {
            if (event.which === 27) {
                const labels = this.getLabels(this.props.nodepath);

                return this.setState({ editing: false, labelString: labels.string });
            } else if (event.which === 13) {
                this.save();
            }
        } catch (error) {
            stat.printError(error);
        }
    }

    onFocus(event) {
        const value = event.target.value;
        event.target.value = "";
        event.target.value = value;
    }

    render() {
        return (
            <div className="node-widget-labels">
                <div className="edit-hover-container">
                    <If condition={this.state.labels.length > 0 && !this.state.editing}>
                        <For each="item" of={this.state.labels}>
                            <Badge
                                key={item}
                                color="primary"
                                style={{ marginRight: 5, marginBottom: 10, cursor: "pointer" }}
                                onClick={(e) => this.onClick(e, item)}
                            >
                                {item}
                            </Badge>
                        </For>
                        <If condition={this.state.editable}>
                            <a
                                className="edit-hover-link"
                                href="#"
                                title="Edit"
                                onClick={(e) => this.onEdit(e)}
                            >
                                <i className="material-icons">edit</i>
                            </a>
                        </If>
                    </If>
                </div>
                <If condition={this.state.labels.length === 0 && !this.state.editing}>
                    <If condition={this.state.editable}>
                        <a
                            style={{ fontStyle: "italic", cursor: "text" }}
                            href="#"
                            onClick={(e) => this.onEdit(e)}
                        >
                            Add labels
                        </a>
                    </If>
                </If>
                <If condition={this.state.editing}>
                    <Input
                        autoFocus={true}
                        type="text"
                        value={this.state.labelString}
                        onChange={(e) => this.setState({ labelString: e.target.value })}
                        onBlur={() => this.save()}
                        onKeyUp={(e) => this.onKeyPress(e)}
                        onFocus={(e) => this.onFocus(e)}
                    />
                </If>
            </div>
        );
    }
}

NodeWidgetLabels.propTypes = {
    nodepath: PropTypes.any.isRequired
};

export default NodeWidgetLabels;
