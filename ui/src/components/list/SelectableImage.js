
import React from "react";
import PropTypes from "prop-types";
import { Icon } from "semantic-ui-react";
import Component from "lib/component";
import { NodeImage } from "components/nodeparts";
import theme from "./theme.module.css";

class SelectableImage extends Component {
    onClick = (e) => {
        this.props.onClick(e, this.props.file);
    }

    onClickDuplicate = (e) => {
        e.stopPropagation();

        this.props.onClickDuplicate(this.props.file);
    }

    render() {
        return (
            <span
                className={theme.selectableImageContainer}
                onClick={this.onClick}
            >
                <NodeImage
                    className={theme.selectableImage}
                    title={this.props.file.attributes.name}
                    path={this.props.file.path}
                    format={{
                        width: this.props.size,
                        height: this.props.size,
                        type: "image"
                    }}
                    lazy
                />
                <If condition={this.props.file.extra.duplicates && this.props.file.extra.duplicates.length > 0}>
                    <div
                        className={theme.hasDuplicates}
                        title="This file has one or more duplicates"
                        onClick={this.props.onClickDuplicate ? this.onClickDuplicate : undefined}
                    >
                        <Icon name="warning circle" />
                    </div>
                </If>
                <If condition={this.props.selected}>
                    <div className={theme.selectedImage} style={{
                        lineHeight: `${this.props.size}px`
                    }}>
                        <Icon name="check" />
                    </div>
                </If>
            </span>
        );
    }
}

SelectableImage.defaultProps = {
    size: 50
};

SelectableImage.propTypes = {
    selected: PropTypes.bool.isRequired,
    file: PropTypes.object.isRequired,
    onClick: PropTypes.func.isRequired,
    onClickDuplicate: PropTypes.func,
    size: PropTypes.number
};

export default SelectableImage;
