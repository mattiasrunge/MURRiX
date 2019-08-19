
import React from "react";
import PropTypes from "prop-types";
import { Route, Switch, Redirect, withRouter } from "react-router-dom";
import { Menu } from "semantic-ui-react";
import { cmd } from "lib/backend";
import session from "lib/session";
import Component from "lib/component";
import ui from "lib/ui";
import { NodeImage } from "components/nodeparts";
import { Edit } from "components/edit";
import Organize from "components/node/pages/sections/Organize";
import { Upload } from "components/upload";
import { Tagging } from "components/tagging";
import { Actions } from "components/actions";
import { Header } from "components/home";
import CircularList from "lib/circular_list";
import theme from "./theme.module.css";

class User extends Component {
    constructor(props) {
        super(props);

        this.state = {
            user: session.user(),
            loading: false,
            error: false,
            username: "",
            name: "",
            person: null
        };
    }

    async load() {
        this.addDisposables([
            session.on("update", (event, user) => {
                this.setState({ user });
            }),
            ui.shortcut("shift+up", this.onPreviousSection),
            ui.shortcut("shift+down", this.onNextSection)
        ]);
    }

    resetPassword() {
        this.props.history.push(`/reset/${this.state.username}`);
    }

    async save() {
        if (!this.state.username || !this.state.password) {
            return;
        }

        this.setState({ loading: true, error: false });

        try {
            await cmd.login(this.state.username, this.state.password);
            this.setState({ loading: false });
        } catch (error) {
            this.logError("Failed to login", error);
            this.setState({ loading: false, error: "Failed to login" });
        }
    }

    onSection = (e, { name }) => {
        this.props.history.push(`/home/user/${name}`);
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
        return this.props.location.pathname.split("/").slice(-1)[0];
    }

    getSections() {
        const section = this.getSection();

        return [
            {
                name: "profile",
                title: "Profile"
            },
            {
                name: "edit",
                title: "Edit",
                icon: "edit",
                active: section === "edit",
                Component: Edit
            },
            {
                name: "actions",
                title: "Actions",
                icon: "keyboard",
                active: section === "actions",
                Component: Actions
            },
            {
                name: "staging",
                title: "Staging"
            },
            {
                name: "upload",
                title: "Upload",
                icon: "upload",
                active: section === "upload",
                Component: Upload
            },
            {
                name: "organize",
                title: "Organize",
                icon: "folder open outline",
                active: section === "organize",
                Component: Organize
            },
            {
                name: "tagging",
                title: "Tagging",
                icon: "user",
                active: section === "tagging",
                Component: Tagging
            }
        ];
    }

    render() {
        const sections = this.getSections();

        return (
            <div>
                <Header
                    profilePath={`${this.state.user.personPath}/profilePicture`}
                    title={this.state.user.attributes.name}
                    subtitle="User profile and staging area"
                />

                <div className={theme.userContainer}>
                    <div className={theme.userSidebar}>
                        <Menu vertical secondary color="blue">
                            <For each="section" of={sections}>
                                <Choose>
                                    <When condition={section.Component}>
                                        <Menu.Item
                                            key={section.name}
                                            name={section.name}
                                            content={section.title}
                                            icon={section.icon}
                                            active={section.active}
                                            onClick={this.onSection}
                                        />
                                    </When>
                                    <Otherwise>
                                        <Menu.Header
                                            key={section.name}
                                            content={section.title}
                                            className={theme.sidebarHeader}
                                        />
                                    </Otherwise>
                                </Choose>
                            </For>
                        </Menu>
                    </div>
                    <div className={theme.userMain}>
                        <Switch>
                            <For each="section" of={sections}>
                                <If condition={section.Component}>
                                    <Route
                                        key={section.name}
                                        path={`/home/user/${section.name}`}
                                    >
                                        {/* eslint-disable-next-line react/jsx-no-undef */}
                                        <section.Component
                                            theme={theme}
                                            node={this.state.user}
                                            match={this.props.match}
                                        />
                                    </Route>
                                </If>
                            </For>
                            <Route path="*">
                                <Redirect
                                    to={{
                                        pathname: `/home/user/${sections.filter((s) => s.Component)[0].name}`
                                    }}
                                />
                            </Route>
                        </Switch>
                    </div>
                </div>
            </div>
        );
    }
}

User.propTypes = {
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired
};

export default withRouter(User);
