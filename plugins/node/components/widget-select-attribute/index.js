
import React from "react";
import Component from "lib/component";
import PropTypes from "prop-types";
import ko from "knockout";
import api from "api.io-client";
import stat from "lib/status";
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from "reactstrap";

class NodeWidgetSelectAttribute extends Component {
    constructor(props) {
        super(props);

        this.state = {
            editable: ko.unwrap(props.nodepath).editable,
            value: "",
            dropdownOpen: false
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
            value: node.attributes[this.props.name]
        });
    }


    async save(item) {
        if (this.state.value === item.name) {
            return;
        }

        try {
            console.log(`Saving attribute ${this.props.name}, old value was \"${this.state.value}\", new value is \"${item.name}\"`);

            const attributes = {};
            attributes[this.props.name] = item.name;

            await api.vfs.setattributes(ko.unwrap(this.props.nodepath).path, attributes);

            console.log(`Save of attribute ${this.props.name} successfull!`);

            this.setState({ value: item.name });
        } catch (error) {
            stat.printError(error);
        }
    }

    toggle() {
        this.setState({ dropdownOpen: !this.state.dropdownOpen });
    }

    render() {
        const nicename = this.props.name.replace(/([A-Z])/g, " $1").toLowerCase();
        const selected = this.props.options.find((o) => o.name === this.state.value);

        return (
            <span className="node-widget-select-attribute">
                <Choose>
                    <When condition={!this.state.editable && !selected}>
                        <i className="text-muted">No {nicename} found</i>
                    </When>
                    <When condition={!this.state.editable && selected}>
                        <i className="material-icons">
                            {selected.icon}
                        </i>
                        <If condition={!this.props.onlyicon}>
                            {" "}
                            {selected.title}
                        </If>
                    </When>
                    <Otherwise>
                        <Dropdown
                            isOpen={this.state.dropdownOpen}
                            toggle={() => this.toggle()}
                        >
                            <DropdownToggle tag="a" className={!selected ? "unselected" : ""}>
                                <If condition={selected}>
                                    <i className="material-icons">
                                        {selected.icon}
                                    </i>
                                    <If condition={!this.props.onlyicon}>
                                        {" "}
                                        {selected.title}
                                    </If>
                                </If>
                                <If condition={!selected}>
                                    <i>Select {nicename}</i>
                                </If>
                            </DropdownToggle>
                            <DropdownMenu>
                                <For each="item" of={this.props.options}>
                                    <DropdownItem
                                        key={item.name}
                                        onClick={() => this.save(item)}
                                    >
                                        <i className="material-icons">
                                            {item.icon}
                                        </i>
                                        {" "}
                                        {item.title}
                                    </DropdownItem>
                                </For>
                            </DropdownMenu>
                        </Dropdown>
                    </Otherwise>
                </Choose>
            </span>
        );
    }
}

NodeWidgetSelectAttribute.propTypes = {
    nodepath: PropTypes.any.isRequired,
    name: PropTypes.string.isRequired,
    options: PropTypes.array.isRequired,
    onlyicon: PropTypes.bool
};

export default NodeWidgetSelectAttribute;
