
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import { Route, Switch, Redirect } from "react-router-dom";
import { Menu } from "semantic-ui-react";
import Edit from "./sections/Edit";
import Share from "./sections/Share";
import Organize from "./sections/Organize";
import { Upload } from "components/upload";

class Settings extends Component {
    onSection = (e, { name }) => {
        this.context.router.history.push(`/node${this.props.node.path}/_/settings/${name}`);
    }

    render() {
        const [ , pagePart ] = this.props.match.url.split("/_/");
        const [ , section ] = pagePart.split("/");

        const sections = [
            {
                name: "edit",
                title: "Edit",
                icon: "edit",
                active: section === "edit",
                Component: Edit
            },
            {
                name: "share",
                title: "Share",
                icon: "share alternate",
                active: section === "share",
                Component: Share
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
            }
        ];

        return (
            <div className={this.props.theme.pageContainer}>
                <div className={this.props.theme.pageSidebar}>
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
                <div className={this.props.theme.pageMain}>
                    <Switch>
                        <Route path={`/node${this.props.node.path}/_/settings/edit`}>
                            <Edit
                                theme={this.props.theme}
                                node={this.props.node}
                                match={this.props.match}
                            />
                        </Route>
                        <Route path={`/node${this.props.node.path}/_/settings/share`}>
                            <Share
                                theme={this.props.theme}
                                node={this.props.node}
                                match={this.props.match}
                            />
                        </Route>
                        <Route path={`/node${this.props.node.path}/_/settings/upload`}>
                            <Upload
                                theme={this.props.theme}
                                node={this.props.node}
                                match={this.props.match}
                            />
                        </Route>
                        <Route path={`/node${this.props.node.path}/_/settings/organize`}>
                            <Organize
                                theme={this.props.theme}
                                node={this.props.node}
                                match={this.props.match}
                            />
                        </Route>
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
    theme: PropTypes.object,
    node: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired
};

Settings.contextTypes = {
    router: PropTypes.object.isRequired
};

export default Settings;
