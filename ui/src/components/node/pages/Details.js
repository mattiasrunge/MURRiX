
import React from "react";
import PropTypes from "prop-types";
import { Route, Switch, Redirect, withRouter } from "react-router-dom";
import { Menu } from "semantic-ui-react";
import Component from "lib/component";
import About from "./sections/About";
import theme from "../theme.module.css";

class Details extends Component {
    onSection = (e, { name }) => {
        this.props.history.push(`/node${this.props.node.path}/_/details/${name}`);
    }

    render() {
        const [ , pagePart ] = this.props.match.url.split("/_/");
        const [ , section ] = pagePart.split("/");

        const sections = [
            {
                name: "about",
                title: "About",
                icon: "id card outline",
                active: section === "about",
                Component: About
            }/* ,
            {
                name: "measurements",
                title: "Measurements",
                icon: "area chart",
                active: section === "measurements",
                Component: Share
            },
            {
                name: "files",
                title: "Files",
                icon: "folder open outline",
                active: section === "files",
                Component: Upload
            }*/
        ];

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
                                path={`/node${this.props.node.path}/_/details/${section.name}`}
                            >
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
                                    pathname: `/node${this.props.node.path}/_/details/${sections[0].name}`
                                }}
                            />
                        </Route>
                    </Switch>
                </div>
            </div>
        );
    }
}

Details.propTypes = {
    node: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired
};

export default withRouter(Details);
