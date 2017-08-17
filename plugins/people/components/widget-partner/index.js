
import ko from "knockout";
import stat from "lib/status";
import loc from "lib/location";
import api from "api.io-client";
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import NodeWidgetNodeSelect from "plugins/node/components/widget-node-select";

class PeopleWidgetPartner extends Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            editing: false,
            editable: ko.unwrap(props.nodepath).editable,
            partner: null
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
            return this.setState({ editable: false, partner: null });
        }

        try {
            const partner = await api.people.getPartner(nodepath.path);

            return this.setState({ partner, editable: nodepath.editable });
        } catch (error) {
            stat.printError(error);
            this.setState({ editable: nodepath.editable, partner: null });
        }
    }

    async save(partner) {
        const nodepath = ko.unwrap(this.props.nodepath);

        try {
            await api.people.setPartner(nodepath.path, partner ? partner.path : false);

            this.setState({ editing: false, partner });
        } catch (error) {
            stat.printError(error);
            this.setState({ editing: false, partner: null });
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
                    <If condition={this.state.partner && !this.state.editing}>
                        <a
                            href="#"
                            onClick={(e) => this.onClick(e, this.state.partner)}
                        >
                            {this.state.partner.node.attributes.name}
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
                <If condition={!this.state.partner && !this.state.editing}>
                    <If condition={this.state.editable}>
                        <a
                            style={{ fontStyle: "italic", cursor: "text" }}
                            href="#"
                            onClick={(e) => this.onEdit(e)}
                        >
                            Select a partner
                        </a>
                    </If>
                </If>
                <If condition={this.state.editing}>
                    <NodeWidgetNodeSelect
                        className="edit-hover-inline-input"
                        root={[ "/people" ]}
                        path={this.state.partner ? this.state.partner.path : null}
                        placeholder=""
                        onSelect={(partner) => this.save(partner)}
                        onBlur={() => this.onCancel()}
                        autoFocus={true}
                    />
                </If>
            </div>
        );
    }
}

PeopleWidgetPartner.propTypes = {
    nodepath: PropTypes.any.isRequired
};

export default PeopleWidgetPartner;
