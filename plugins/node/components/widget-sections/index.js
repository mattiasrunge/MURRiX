
import React from "react";
import Component from "lib/component";
import PropTypes from "prop-types";
import loc from "lib/location";
import NodeSectionUpload from "plugins/node/components/section-upload";
import NodeSectionShare from "plugins/node/components/section-share";
import NodeSectionMove from "plugins/node/components/section-move";

class NodeWidgetSections extends Component {
    constructor(props) {
        super(props);

        this.state = {
            section: loc.get("section") || "default"
        };
    }

    componentDidMount() {
        this.addDisposables([
            loc.subscribe(({ section }) => this.setState({
                section: section || "default"
            }))
        ]);
    }

    onClick(event, section) {
        event.preventDefault();

        loc.goto({ section: section.name });
    }

    render() {
        let section = this.props.sections.find((s) => s.name === this.state.section);

        if (!section && this.state.section === "default" && this.props.sections.length > 0) {
            section = this.props.sections[0];
        }

        return (
            <div>
                <div className="row" style={{ display: "none" }}>
                    <ul
                        className="nav nav-pills"
                        style={{ marginLeft: "15px", marginRight: "15px", width: "100%" }}
                    >
                        <For each="item" index="idx" of={this.props.sections}>
                            <li
                                key={item.name}
                                className={`nav-item ${this.state.section === item.name || (idx === 0 && this.state.section === "default") ? "active" : ""} ${idx === this.props.sections.length - 1 ? "mr-auto" : ""}`}
                            >
                                <a
                                    href="#"
                                    className="nav-link"
                                    onClick={(e) => this.onClick(e, item)}
                                >
                                    <i className="material-icons md-18">{item.icon}</i>
                                    {" "}
                                    {item.title}
                                </a>
                            </li>
                        </For>
                    </ul>
                </div>

                <If condition={section}>
                    <section.Element
                        nodepath={this.props.nodepath}
                    />
                </If>
                <If condition={this.state.section === "upload"}>
                    <NodeSectionUpload
                        nodepath={this.props.nodepath}
                    />
                </If>
                <If condition={this.state.section === "share"}>
                    <NodeSectionShare
                        nodepath={this.props.nodepath}
                    />
                </If>
                <If condition={this.state.section === "move"}>
                    <NodeSectionMove
                        nodepath={this.props.nodepath}
                    />
                </If>
            </div>
        );
    }
}

NodeWidgetSections.propTypes = {
    sections: PropTypes.array.isRequired,
    nodepath: PropTypes.any
};

export default NodeWidgetSections;
