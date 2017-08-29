
import React from "react";
import Component from "lib/component";
import PropTypes from "prop-types";
import ko from "knockout";
import api from "api.io-client";
import stat from "lib/status";
import NodeWidgetTimeInput from "plugins/node/components/widget-time-input";

class NodeWidgetWhenAttribute extends Component {
    constructor(props) {
        super(props);

        this.state = {
            editable: ko.unwrap(props.nodepath).editable,
            value: false
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

    load(nodepath) {
        if (!nodepath) {
            return this.setState({ editable: false, value: "", newValue: "" });
        }

        const node = ko.unwrap(nodepath.node);
        const value = node.attributes.when ? node.attributes.when.manual : false;

        this.setState({
            editable: nodepath.editable,
            value: value
        });
    }

    async save(value) {
        const nodepath = ko.unwrap(this.props.nodepath);
        const node = ko.unwrap(nodepath.node);

        try {
            console.log(`Saving attribute when.manual, old value was \"${JSON.stringify(node.attributes.when ? node.attributes.when.manual : false)}\", new value is \"${JSON.stringify(value)}\"`);

            const attributes = {
                when: node.attributes.when || {}
            };

            attributes.when.manual = value || false;

            await api.vfs.setattributes(ko.unwrap(this.props.nodepath).path, attributes);

            console.log("Save of attribute when.manual successfull!");

            // TODO: Do model serverside based on events
            if (node.properties.type === "f") {
                await api.file.regenerate(ko.unwrap(this.props.nodepath).path);
            }

            this.setState({ value: value });
        } catch (error) {
            stat.printError(error);
        }
    }

    render() {
        return (
            <NodeWidgetTimeInput
                disabled={!this.state.editable}
                value={this.state.value}
                onChange={(value) => this.save(value)}
            />
        );
    }
}

NodeWidgetWhenAttribute.propTypes = {
    nodepath: PropTypes.any.isRequired
};

export default NodeWidgetWhenAttribute;
