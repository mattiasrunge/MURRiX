
import React from "react";
import { Header } from "semantic-ui-react";
import SidebarMenuItem from "./SidebarMenuItem";
import theme from "./theme.module.css";

const Sidebar = () => (
    <div className={theme.homeSidebar}>
        <div className={theme.menu}>
            <Header>Explore</Header>
            <SidebarMenuItem
                text="News"
                path="/home/news"
            />
            <SidebarMenuItem
                text="Search"
                path="/home/search"
            />
            <SidebarMenuItem
                text="Browse by name"
                path="/home/name"
            />
            <SidebarMenuItem
                text="Browse by label"
                path="/home/label"
            />
            <SidebarMenuItem
                text="Browse albums by year"
                path="/home/year"
            />
        </div>
        <div className={theme.menu}>
            <Header>Charts</Header>
            <SidebarMenuItem
                text="Events"
                path="/home/charts/events"
            />
            <SidebarMenuItem
                text="Content"
                path="/home/charts/content"
            />
        </div>
    </div>
);

export default Sidebar;
