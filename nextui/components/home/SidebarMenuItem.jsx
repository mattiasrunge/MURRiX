
import React from "react";
import PropTypes from "prop-types";
import Link from "next/link";
import { useRouter } from "next/router";
import theme from "./theme.module.css";

const SidebarMenuItem = ({ path, text }) => {
    const router = useRouter();
    const active = router.asPath.startsWith(path);

    return (
        <Link href={path}>
            <a className={`${theme.item} ${active ? theme.active : ""}`}>
                {text}
            </a>
        </Link>
    );
};

SidebarMenuItem.propTypes = {
    path: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired
};

export default SidebarMenuItem;
