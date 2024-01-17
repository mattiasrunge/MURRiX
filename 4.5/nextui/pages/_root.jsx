
import React from "react";
import PropTypes from "prop-types";
import getConfig from "next/config";
import Head from "next/head";
import { NotificationContainer } from "react-notifications";
import useWebSocket from "hooks/useWebSocket";
import { Navbar } from "components/navbar";
import { Terminal } from "components/terminal";
import { JobsContainer } from "components/jobs";

import { Node } from "components/node";
import { User } from "components/user";
import { Organize } from "components/organize";
import { SignIn, Reset } from "components/authentication";
import { UploadProgress } from "components/upload";
import theme from "./theme.module.css";
import "semantic-ui-css/semantic.css";
import "animate.css/animate.css";
import "leaflet/dist/leaflet.css";
import "react-notifications/lib/notifications.css";

const { publicRuntimeConfig } = getConfig() || {};
const config = publicRuntimeConfig || {};

const Root = ({ Component, pageProps }) => {
    const ready = useWebSocket(config.coreURL);

    if (!ready) {
        return null;
    }

    return (
        <>
            <Head>
                <title>{config.title}</title>
            </Head>

            <Terminal />
            <NotificationContainer />
            <Navbar />
            <JobsContainer />
            <UploadProgress />

            <div className={theme.rootContainer}>
                <Component {...pageProps} />
            </div>
        </>
    );
};

Root.propTypes = {
    Component: PropTypes.any,
    pageProps: PropTypes.any
};

export default Root;
