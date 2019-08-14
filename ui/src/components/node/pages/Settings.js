
import React from "react";
import PropTypes from "prop-types";
import { Route, Switch, Redirect, withRouter } from "react-router-dom";
import { Menu } from "semantic-ui-react";
import Component from "lib/component";
import { Edit } from "components/edit";
import Share from "./sections/Share";
import Organize from "./sections/Organize";
// import Batch from "./sections/Batch";
import { Upload } from "components/upload";
import { Tagging } from "components/tagging";
import { Actions } from "components/actions";
import ui from "lib/ui";
import CircularList from "lib/circular_list";
import theme from "../theme.module.css";

class Settings extends Component {
    async load() {
        this.addDisposables([
            ui.shortcut("shift+up", this.onPreviousSection),
            ui.shortcut("shift+down", this.onNextSection)
        ]);
    }

    onSection = (e, { name }) => {
        this.props.history.push(`/node${this.props.node.path}/_/settings/${name}`);
    }

    gotoSection = (offset) => {
        const sections = this.getSections();
        const list = new CircularList(sections);

        const section = list
        .select((section) => section.active)
        .offset(offset)
        .current;

        this.onSection(null, { name: section.name });
    }

    onNextSection = () => {
        this.gotoSection(1);
    }

    onPreviousSection = () => {
        this.gotoSection(-1);
    }

    getSection() {
        const [ , pagePart ] = this.props.location.pathname.split("/_/");
        const [ , section ] = pagePart.split("/");

        return section;
    }

    getSections() {
        const section = this.getSection();

        const allSections = [
            {
                name: "edit",
                title: "Edit",
                icon: "edit",
                active: section === "edit",
                Component: Edit,
                validTypes: [ "a", "l", "c", "p" ]
            },
            {
                name: "share",
                title: "Share",
                icon: "share alternate",
                active: section === "share",
                Component: Share,
                validTypes: [ "a", "l", "c", "p" ]
            },
            {
                name: "actions",
                title: "Actions",
                icon: "keyboard",
                active: section === "actions",
                Component: Actions,
                validTypes: [ "l", "c", "p" ]
            },
            {
                name: "upload",
                title: "Upload",
                icon: "upload",
                active: section === "upload",
                Component: Upload,
                validTypes: [ "a" ]
            },
            {
                name: "organize",
                title: "Organize",
                icon: "folder open outline",
                active: section === "organize",
                Component: Organize,
                validTypes: [ "a" ]
            },
            // {
            //     name: "batch",
            //     title: "Batch Operations",
            //     icon: "cogs",
            //     active: section === "batch",
            //     Component: Batch,
            //     validTypes: [ "a" ]
            // },
            {
                name: "tagging",
                title: "Tagging",
                icon: "user",
                active: section === "tagging",
                Component: Tagging,
                validTypes: [ "a" ]
            }
        ];

        return allSections.filter((section) => this.props.node && section.validTypes.includes(this.props.node.properties.type));
    }

    render() {
        const sections = this.getSections();

        return (
            <div className={theme.pageContainer}>
                <div className={theme.pageSidebar}>
                    <Menu vertical secondary color="blue">
                        <For each="section" of={sections}>
                            <Menu.Item
                                key={section.name}
                                name={section.name}
                                content={section.title}
                                icon={section.icon}
                                active={section.active}
                                onClick={this.onSection}
                            />
                        </For>
                    </Menu>
                </div>
                <div className={theme.pageMain}>
                    <Switch>
                        <For each="section" of={sections}>
                            <Route
                                key={section.name}
                                path={`/node${this.props.node.path}/_/settings/${section.name}`}
                            >
                                {/* eslint-disable-next-line react/jsx-no-undef */}
                                <section.Component
                                    theme={theme}
                                    node={this.props.node}
                                    match={this.props.match}
                                />
                            </Route>
                        </For>
                        <Route path="*">
                            <Redirect
                                to={{
                                    pathname: `/node${this.props.node.path}/_/settings/${sections[0].name}`
                                }}
                            />
                        </Route>
                    </Switch>
                </div>
            </div>
        );
    }
}

Settings.propTypes = {
    node: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired
};

export default withRouter(Settings);
