
import React from "react";
import Component from "lib/component";
import PropTypes from "prop-types";
import ko from "knockout";
import api from "api.io-client";
import stat from "lib/status";

class NodeWidgetTextAttribute extends Component {
    constructor(props) {
        super(props);

        this.state = {
            editable: ko.unwrap(props.nodepath).editable,
            value: "",
            newValue: ""
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

        this.setState({
            editable: nodepath.editable,
            value: node.attributes[this.props.name],
            newValue: node.attributes[this.props.name]
        });
    }


    async save() {
        const value = this.state.newValue.replace(/(^\n|\n$)/g, "");

        if (this.state.value === value) {
            return;
        }

        try {
            console.log(`Saving attribute ${this.props.name}, old value was \"${this.state.value}\", new value is \"${value}\"`);

            const attributes = {};
            attributes[this.props.name] = value;

            await api.vfs.setattributes(ko.unwrap(this.props.nodepath).path, attributes);

            console.log(`Save of attribute ${this.props.name} successfull!`);

            this.setState({ value: value });
        } catch (error) {
            stat.printError(error);
        }
    }

    onKeyUp(event) {
        if (event.which === 27) {
            this.setState({ newValue: this.state.value });
            this.ref.innerText = this.state.value;

            setTimeout(() => this.ref.blur(), 100);
        }
    }

    render() {
        const nicename = this.props.name.replace(/([A-Z])/g, " $1").toLowerCase();

        return (
            <span className="node-widget-text-attribute">
                <Choose>
                    <When condition={!this.state.editable && this.state.value === ""}>
                        <i className="text-muted">No {nicename} found</i>
                    </When>
                    <Otherwise>
                        <span
                            style={{ whiteSpace: "pre" }}
                            dangerouslySetInnerHTML={{ __html: this.state.value }}
                            ref={(ref) => this.ref = ref}
                            contentEditable={this.state.editable}
                            onInput={(e) => {
                                this.setState({ newValue: e.target.innerText });
                            }}
                            onKeyUp={(e) => this.onKeyUp(e)}
                            onBlur={() => this.save()}
                            placeholder={`Add ${nicename}`}
                        ></span>
                    </Otherwise>
                </Choose>
            </span>
        );
    }
}

NodeWidgetTextAttribute.propTypes = {
    nodepath: PropTypes.any.isRequired,
    name: PropTypes.string.isRequired
};

export default NodeWidgetTextAttribute;
