
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
                        width: 50,
                        height: 50,
                        type: "image"
                    }}
                    lazy
                />
                <If condition={this.props.selected}>
                    <div className={theme.selectedImage}>
                        <Icon name="check" />
                    </div>
                </If>
            </span>
        );
    }
}

SelectableImage.propTypes = {
    selected: PropTypes.bool.isRequired,
    file: PropTypes.object.isRequired,
    onClick: PropTypes.func.isRequired
};

export default SelectableImage;
