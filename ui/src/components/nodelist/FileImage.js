
import React from "react";
import PropTypes from "prop-types";
import { Image } from "semantic-ui-react";
import useFileImageUrl from "hooks/useFileImageUrl";

const FileImage = (props) => {
    const { loading, value } = useFileImageUrl(props.file);

    return (
        <Image
            loading={loading}
            className={props.className}
            src={value}
            title={props.title}
            avatar={props.avatar}
            bordered={props.bordered}
            centered={props.centered}
            circular={props.circular}
            floated={props.floated}
            inline={props.inline}
            fluid={props.fluid}
            rounded={props.rounded}
            size={props.size}
            spaced={props.spaced}
            verticalAlign={props.verticalAlign}
            wrapped={props.wrapped}
            style={props.style}
            draggable="false"
        />
    );
};

FileImage.propTypes = {
    file: PropTypes.object.isRequired,
    className: PropTypes.string,
    title: PropTypes.string,
    avatar: PropTypes.bool,
    bordered: PropTypes.bool,
    centered: PropTypes.bool,
    circular: PropTypes.bool,
    floated: PropTypes.string,
    inline: PropTypes.bool,
    fluid: PropTypes.bool,
    rounded: PropTypes.bool,
    size: PropTypes.string,
    spaced: PropTypes.any,
    verticalAlign: PropTypes.string,
    wrapped: PropTypes.bool,
    style: PropTypes.object
};

export default FileImage;
