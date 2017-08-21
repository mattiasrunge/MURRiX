
import loc from "lib/location";
import api from "api.io-client";
import React from "react";
import PropTypes from "prop-types";
import AsyncComponent from "lib/async_component";
import stat from "lib/status";
import NodeWidgetPage from "plugins/node/components/widget-page";
import NodeWidgetTextAttribute from "plugins/node/components/widget-text-attribute";
import PeopleWidgetParent from "plugins/people/components/widget-parent";
import PeopleWidgetPartner from "plugins/people/components/widget-partner";
import NodeWidgetSelectAttribute from "plugins/node/components/widget-select-attribute";
import NodeSectionMedia from "plugins/node/components/section-media";
import NodeSectionContact from "plugins/people/components/section-contact";
import NodeSectionFamily from "plugins/people/components/section-family";
import NodeSectionTimeline from "plugins/people/components/section-timeline";

class PeoplePage extends AsyncComponent {
    getInitialState() {
        return { metrics: false };
    }

    onLoadError(error) {
        stat.printError(error);

        return { metrics: false };
    }

    async load(props, w) {
        if (!props.nodepath) {
            return { metrics: false };
        }

        return { metrics: await w(api.people.getMetrics(props.nodepath.path)) };
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
                        Element: NodeSectionTimeline
                    },
                    {
                        name: "media",
                        icon: "photo_library",
                        title: "Media",
                        Element: NodeSectionMedia
                    },
                    {
                        name: "contact",
                        icon: "contact_mail",
                        title: "Contact",
                        Element: NodeSectionContact
                    },
                    {
                        name: "family",
                        icon: "people",
                        title: "Family",
                        Element: NodeSectionFamily
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
    nodepath: PropTypes.object.isRequired
};

export default PeoplePage;
