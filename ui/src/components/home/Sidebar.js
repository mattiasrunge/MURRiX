
import React from "react";
import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";
import { Header } from "semantic-ui-react";
import Component from "lib/component";
import SidebarMenuItem from "./SidebarMenuItem";
import theme from "./theme.module.css";

class Sidebar extends Component {
    render() {
        return (
            <div className={theme.homeSidebar}>
                <div className={theme.menu}>
                    <Header>Explore</Header>
                    <SidebarMenuItem
                        theme={theme}
                        text="News"
                        path={`${this.props.match.path}/news`}
                    />
                    <SidebarMenuItem
                        theme={theme}
                        text="Search"
                        path={`${this.props.match.path}/search`}
                    />
                    <SidebarMenuItem
                        theme={theme}
                        text="Browse by name"
                        path={`${this.props.match.path}/name`}
                    />
                    <SidebarMenuItem
                        theme={theme}
                        text="Browse by label"
                        path={`${this.props.match.path}/label`}
                    />
                    <SidebarMenuItem
                        theme={theme}
                        text="Browse albums by year"
                        path={`${this.props.match.path}/year`}
                    />
                </div>
                <div className={theme.menu}>
                    <Header>Charts</Header>
                    <SidebarMenuItem
                        theme={theme}
                        text="Events"
                        path={`${this.props.match.path}/charts/events`}
                    />
                    <SidebarMenuItem
                        theme={theme}
                        text="Content"
                        path={`${this.props.match.path}/charts/content`}
                    />
                </div>
            </div>
        );
    }
}

Sidebar.propTypes = {
    match: PropTypes.object.isRequired
};

export default withRouter(Sidebar);
