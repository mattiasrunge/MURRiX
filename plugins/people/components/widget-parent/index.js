

import ko from "knockout";
import stat from "lib/status";
import loc from "lib/location";
import api from "api.io-client";
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import NodeWidgetNodeSelect from "plugins/node/components/widget-node-select";

class PeopleWidgetParent extends Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            editing: false,
            editable: ko.unwrap(props.nodepath).editable,
            parent: null
        };
    }

    componentDidMount() {
        if (ko.isObservable(this.props.nodepath)) {
            this.addDisposables([
                this.props.nodepath.subscribe((nodepath) => this.load(nodepath))
            ]);
        }

        this.load(ko.unwrap(this.props.nodepath));
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.nodepath !== ko.unwrap(nextProps.nodepath)) {
            this.load(ko.unwrap(nextProps.nodepath));
        }
    }

    async load(nodepath) {
        if (!nodepath) {
            return this.setState({ editable: nodepath.editable, parent: null });
        }

        try {
            const parent = await api.people.getParent(nodepath.path, this.props.gender);

            return this.setState({ parent, editable: nodepath.editable });
        } catch (error) {
            stat.printError(error);
            this.setState({ editable: nodepath.editable, parent: null });
        }
    }

    async save(parent) {
        const nodepath = ko.unwrap(this.props.nodepath);

        try {
            await api.people.setParent(nodepath.path, parent ? parent.path : false, this.props.gender);

            this.setState({ editing: false, parent });
        } catch (error) {
            stat.printError(error);
            this.setState({ editing: false, parent: null });
        }
    }

    onClick(event, node) {
        event.preventDefault();

        loc.goto({ page: "node", path: node.path });
    }

    onEdit(event) {
        event.preventDefault();

        this.setState({ editing: true });
    }

    onCancel() {
        this.setState({ editing: false });
    }

    render() {
        return (
            <div>
                <div className="edit-hover-container">
                    <If condition={this.state.parent && !this.state.editing}>
                        <a
                            href="#"
                            onClick={(e) => this.onClick(e, this.state.parent)}
                        >
                            {this.state.parent.node.attributes.name}
                        </a>
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
                <If condition={!this.state.parent && !this.state.editing}>
                    <If condition={this.state.editable}>
                        <a
                            style={{ fontStyle: "italic", cursor: "text" }}
                            href="#"
                            onClick={(e) => this.onEdit(e)}
                        >
                            Select a parent
                        </a>
                    </If>
                </If>
                <If condition={this.state.editing}>
                    <NodeWidgetNodeSelect
                        className="edit-hover-inline-input"
                        root={[ "/people" ]}
                        path={this.state.parent ? this.state.parent.path : null}
                        placeholder=""
                        onSelect={(parent) => this.save(parent)}
                        onBlur={() => this.onCancel()}
                        autoFocus={true}
                        filter={{
                            "attributes.gender": this.props.gender
                        }}
                    />
                </If>
            </div>
        );
    }
}

PeopleWidgetParent.propTypes = {
    nodepath: PropTypes.any.isRequired,
    gender: PropTypes.string.isRequired
};

export default PeopleWidgetParent;
