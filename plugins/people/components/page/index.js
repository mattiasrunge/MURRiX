

import ko from "knockout";
import loc from "lib/location";
import api from "api.io-client";
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import stat from "lib/status";
import NodeWidgetPage from "plugins/node/components/widget-page";
import NodeWidgetTextAttribute from "plugins/node/components/widget-text-attribute";
import PeopleWidgetParent from "plugins/people/components/widget-parent";
import PeopleWidgetPartner from "plugins/people/components/widget-partner";
import NodeWidgetSelectAttribute from "plugins/node/components/widget-select-attribute";

class PeoplePage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            metrics: false
        };
    }

    componentDidMount() {
        this.addDisposables([
            this.props.nodepath.subscribe((np) => this.load(np))
        ]);

        this.load(ko.unwrap(this.props.nodepath));
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.nodepath !== nextProps.nodepath) {
            this.load(ko.unwrap(nextProps.nodepath));
        }
    }

    async load(nodepath) {
        const state = {
            metrics: false
        };

        if (!nodepath) {
            return this.setState(state);
        }

        const node = ko.unwrap(nodepath.node);

        if (!node) {
            return this.setState(state);
        }

        try {
            state.metrics = await api.people.getMetrics(nodepath.path);
        } catch (error) {
            stat.printError(error);
        }

        this.setState(state);
    }

    onClick(event, nodepath) {
        event.preventDefault();

        loc.goto({ page: "node", path: nodepath.path });
    }

    render() {
        return (
            <NodeWidgetPage
                nodepath={this.props.nodepath}
                sections={[
                    {
                        name: "timeline",
                        icon: "event",
                        title: "Timeline",
                        react: "people-section-timeline"
                    },
                    {
                        name: "media",
                        icon: "photo_library",
                        title: "Media",
                        react: "node-section-media"
                    },
                    {
                        name: "contact",
                        icon: "contact_mail",
                        title: "Contact",
                        react: "people-section-contact"
                    },
                    {
                        name: "family",
                        icon: "people",
                        title: "Family",
                        react: "people-section-family"
                    }
                ]}
                information={[
                    {
                        name: "Birth name",
                        value: (
                            <NodeWidgetTextAttribute
                                nodepath={this.props.nodepath}
                                name="birthname"
                            />
                        )
                    },
                    this.state.metrics && this.state.metrics.birthdate && {
                        name: "Date of birth",
                        value: this.state.metrics.birthdate
                    },
                    this.state.metrics && this.state.metrics.deathdate && {
                        name: "Date of death",
                        value: this.state.metrics.deathdate
                    },
                    this.state.metrics && this.state.metrics.deathdate && {
                        name: "Age at death",
                        value: this.state.metrics.ageatdeath
                    },
                    this.state.metrics && this.state.metrics.birthdate && {
                        name: "Age",
                        value: this.state.metrics.age
                    },
                    {
                        name: "Gender",
                        value: (
                            <NodeWidgetSelectAttribute
                                nodepath={this.props.nodepath}
                                name="gender"
                                options={[
                                    {
                                        name: "f",
                                        title: "Female"
                                    },
                                    {
                                        name: "m",
                                        title: "Male"
                                    }
                                ]}
                            />
                        )
                    },
                    {
                        name: "Partner",
                        value: (
                            <PeopleWidgetPartner
                                nodepath={this.props.nodepath}
                            />
                        )
                    },
                    {
                        name: "Mother",
                        value: (
                            <PeopleWidgetParent
                                nodepath={this.props.nodepath}
                                gender="f"
                            />
                        )
                    },
                    {
                        name: "Father",
                        value: (
                            <PeopleWidgetParent
                                nodepath={this.props.nodepath}
                                gender="m"
                            />
                        )
                    },
                    {
                        name: "Allergies",
                        value: (
                            <NodeWidgetTextAttribute
                                nodepath={this.props.nodepath}
                                name="allergies"
                            />
                        )
                    }
                ]}
            />
        );
    }
}

PeoplePage.propTypes = {
    nodepath: PropTypes.func
};

export default PeoplePage;
