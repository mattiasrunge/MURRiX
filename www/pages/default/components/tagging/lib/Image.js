
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import { NodeImage } from "components/nodeparts";
import RegionSelect from "react-region-select";
import uuid from "uuid";

class Image extends Component {
    constructor(props) {
        super(props);

        this.state = {
            regions: this.faces2regions(props.faces)
        };
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.faces !== nextProps.faces) {
            this.setState({
                regions: this.faces2regions(nextProps.faces)
            });
        }
    }

    faces2regions(faces) {
        return faces.map((face) => ({
            x: (face.x - (face.w / 2)) * 100,
            y: (face.y - (face.h / 2)) * 100,
            width: face.w * 100,
            height: face.h * 100,
            data: {
                id: face.id,
                confidence: face.confidence,
                detector: face.detector
            }
        }));
    }

    regions2faces(regions) {
        return regions.map((region) => ({
            x: (region.x + (region.width / 2)) / 100,
            y: (region.y + (region.height / 2)) / 100,
            w: region.width / 100,
            h: region.height / 100,
            id: region.data ? region.data.id : uuid.v4(),
            confidence: region.data ? region.data.confidence : 1,
            detector: region.data ? region.data.detector : "manual"
        }));
    }

    onChange = (regions) => {
        regions.forEach((region) => {
            if (region.new) {
                region.data.id = uuid.v4();
                region.data.confidence = 1;
                region.data.detector = "manual";
            }
        });

        this.setState({ regions });

        const isChanging = regions.some((region) => region.isChanging);

        !isChanging && this.props.onChange(this.regions2faces(regions));
    }

    regionRenderer = (data) => {
        return `${data.index + 1}`;
    }

    render() {
        return (
            <div className={this.props.theme.tagImageContainer}>
                <RegionSelect
                    constraint
                    regions={this.state.regions}
                    onChange={this.onChange}
                    className={this.props.theme.tagImageRegionContainer}
                    regionRenderer={this.regionRenderer}
                >
                    <NodeImage
                        path={this.props.path}
                        format={{
                            width: 2000,
                            type: "image"
                        }}
                    />
                </RegionSelect>
                {/* <For each="face" index="index" of={this.props.node.attributes.faces || []}>
                    <div
                        key={index}
                        className={this.classNames(this.props.theme.tagFrame, this.props.face && this.props.face !== face ? this.props.theme.tagFrameHidden : "", this.props.face === face ? this.props.theme.tagFrameSelected : "")}
                        style={{
                            top: `${(face.y - (face.h / 2)) * 100}%`,
                            bottom: `${100 - ((face.y + (face.h / 2)) * 100)}%`,
                            left: `${(face.x - (face.w / 2)) * 100}%`,
                            right: `${100 - ((face.x + (face.w / 2)) * 100)}%`
                        }}
                    >
                        <span>
                            #{index + 1}
                        </span>
                    </div>
                </For> */}
            </div>
        );
    }
}

Image.propTypes = {
    theme: PropTypes.object,
    path: PropTypes.string.isRequired,
    faces: PropTypes.array.isRequired,
    onChange: PropTypes.func.isRequired
};

export default Image;
