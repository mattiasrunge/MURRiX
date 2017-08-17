
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
        const selected = this.props.options.find((o) => o.name === this.state.value) || this.props.options[0];

        return (
            <span className="node-widget-select-attribute">
                <Choose>
                    <When condition={!this.state.editable && this.state.value === ""}>
                        <i className="text-muted">No {nicename} found</i>
                    </When>
                    <When condition={!this.state.editable && this.state.value !== ""}>
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
                            <DropdownToggle tag="a">
                                <i className="material-icons">
                                    {selected.icon}
                                </i>
                                <If condition={!this.props.onlyicon}>
                                    {" "}
                                    {selected.title}
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

            // ﻿<span className="dropdown">
            //     <span data-toggle="dropdown">
            //         <i className="material-icons" style={{ marginRight: "-1px", marginBottom: "-1px" }} data-bind="visible: icon, text: icon"></i>
            //         <span data-bind="visible: !onlyicon(), text: nicevalue"></span>
            //     </span>
            //
            //     <span className="dropdown-select-empty" data-toggle="dropdown" data-bind="text: 'Select ' + nicename(), css: { 'dropdown-toggle': editable }, visible: value() === '' && editable()"></span>
            //
            //     <span className="dropdown-select-empty" data-bind="text: 'No ' + nicename(), visible: value() === '' && !editable()"></span>
            //
            //     <ul className="dropdown-menu" data-bind="foreach: options">
            //         <li className="dropdown-item">
            //             <a href="#" data-bind="click: $root.change.bind($data, $data.name)">
            //                 <i className="material-icons" data-bind="visible: $data.icon, text: $data.icon" style={{ marginRight: "10px" }}></i>
            //                 <span data-bind="text: $data.title"></span>
            //             </a>
            //         </li>
            //     </ul>
            // </span>

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
