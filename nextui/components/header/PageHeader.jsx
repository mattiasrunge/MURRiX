
import React from "react";
import PropTypes from "prop-types";
import { Header, Icon } from "semantic-ui-react";
import { NodeImage } from "components/nodeparts";
import theme from "./theme.module.css";

const STYLE = {
    float: "right",
    marginLeft: 20,
    marginBottom: 20
};

const PICTURE_FORMAT = {
    width: 50,
    height: 50,
    type: "image"
};

const PageHeader = ({ icon, profilePath, title, subtitle, extra }) => (
    <div className={theme.header}>
        <Choose>
            <When condition={profilePath}>
                <NodeImage
                    path={profilePath}
                    format={PICTURE_FORMAT}
                    avatar
                    floated="right"
                />
            </When>
            <When condition={icon}>
                <Icon
                    name={icon}
                    size="big"
                    style={STYLE}
                />
            </When>
        </Choose>

        <Header as="h2">
            {extra}

            {title}
            <Header.Subheader>
                {subtitle}
            </Header.Subheader>
        </Header>
    </div>
);

PageHeader.propTypes = {
    icon: PropTypes.string,
    profilePath: PropTypes.string,
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string.isRequired,
    extra: PropTypes.any
};

export default PageHeader;
