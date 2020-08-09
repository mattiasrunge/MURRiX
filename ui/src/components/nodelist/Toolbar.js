
import React from "react";
import PropTypes from "prop-types";
import { Menu, Dropdown } from "semantic-ui-react";
import NodeSelect from "./NodeSelect";

const TYPE_ICONS = {
    grid_large: "block layout", // eslint-disable-line camelcase
    grid_small: "grid layout", // eslint-disable-line camelcase
    list: "list"
};

const FILTER_ICONS = {
    all: "eye",
    image: "image",
    video: "film",
    audio: "sound",
    other: "file alternate outline"
};

const getTypeIcon = (type) => ({
    name: TYPE_ICONS[type] ?? Object.values(TYPE_ICONS)[0],
    fitted: true
});
const getFilterIcon = (filter) => ({
    name: FILTER_ICONS[filter] ?? Object.values(FILTER_ICONS)[0],
    fitted: true
});

const Toolbar = (props) => {
    const onList = React.useCallback(() => {
        props.onType("list");
    }, [ props.onType ]);

    const onGridSmall = React.useCallback(() => {
        props.onType("grid_small");
    }, [ props.onType ]);

    const onGridLarge = React.useCallback(() => {
        props.onType("grid_large");
    }, [ props.onType ]);

    const onShowAll = React.useCallback(() => {
        props.onFilter(null);
    }, [ props.onFilter ]);

    const onShowImages = React.useCallback(() => {
        props.onFilter("image");
    }, [ props.onFilter ]);

    const onShowVideos = React.useCallback(() => {
        props.onFilter("video");
    }, [ props.onFilter ]);

    const onShowAudio = React.useCallback(() => {
        props.onFilter("audio");
    }, [ props.onFilter ]);

    const onShowOther = React.useCallback(() => {
        props.onFilter("other");
    }, [ props.onFilter ]);

    return (
        <Menu
            style={{ marginTop: 0, marginBottom: 0 }}
            color="grey"
        >
            <If condition={props.onNode}>
                <NodeSelect
                    node={props.node}
                    onChange={props.onNode}
                    paths={[
                        "/albums"
                    ]}
                />
            </If>
            <Menu.Menu position="right">
                <Dropdown
                    item
                    icon={getFilterIcon(props.filter)}
                >
                    <Dropdown.Menu>
                        <Dropdown.Item
                            icon={getFilterIcon("all")}
                            content="All"
                            onClick={onShowAll}
                        />
                        <Dropdown.Item
                            icon={getFilterIcon("image")}
                            content="Images"
                            onClick={onShowImages}
                        />
                        <Dropdown.Item
                            icon={getFilterIcon("video")}
                            content="Videos"
                            onClick={onShowVideos}
                        />
                        <Dropdown.Item
                            icon={getFilterIcon("sound")}
                            content="Sounds"
                            onClick={onShowAudio}
                        />
                        <Dropdown.Item
                            icon={getFilterIcon("other")}
                            content="Others"
                            onClick={onShowOther}
                        />
                    </Dropdown.Menu>
                </Dropdown>
                <Dropdown
                    item
                    icon={getTypeIcon(props.type)}
                >
                    <Dropdown.Menu>
                        <Dropdown.Item
                            icon={getTypeIcon("list")}
                            content="List"
                            onClick={onList}
                        />
                        <Dropdown.Item
                            icon={getTypeIcon("grid_small")}
                            content="Small Icons"
                            onClick={onGridSmall}
                        />
                        <Dropdown.Item
                            icon={getTypeIcon("grid_large")}
                            content="Large Icons"
                            onClick={onGridLarge}
                        />
                    </Dropdown.Menu>
                </Dropdown>
            </Menu.Menu>
        </Menu>
    );
};

Toolbar.propTypes = {
    type: PropTypes.oneOf([
        "grid_small",
        "grid_large",
        "list"
    ]),
    onType: PropTypes.func.isRequired,
    filter: PropTypes.string,
    onFilter: PropTypes.func.isRequired,
    node: PropTypes.object,
    onNode: PropTypes.func
};

export default Toolbar;
