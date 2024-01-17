
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

const Toolbar = ({ type, onType, filter, onFilter, node, onNode }) => {
    const onList = React.useCallback(() => {
        onType("list");
    }, [ onType ]);

    const onGridSmall = React.useCallback(() => {
        onType("grid_small");
    }, [ onType ]);

    const onGridLarge = React.useCallback(() => {
        onType("grid_large");
    }, [ onType ]);

    const onShowAll = React.useCallback(() => {
        onFilter(null);
    }, [ onFilter ]);

    const onShowImages = React.useCallback(() => {
        onFilter("image");
    }, [ onFilter ]);

    const onShowVideos = React.useCallback(() => {
        onFilter("video");
    }, [ onFilter ]);

    const onShowAudio = React.useCallback(() => {
        onFilter("audio");
    }, [ onFilter ]);

    const onShowOther = React.useCallback(() => {
        onFilter("other");
    }, [ onFilter ]);

    return (
        <Menu
            style={{ marginTop: 0, marginBottom: 0 }}
            color="grey"
        >
            <If condition={onNode}>
                <NodeSelect
                    node={node}
                    onChange={onNode}
                    paths={[
                        "/albums"
                    ]}
                />
            </If>
            <Menu.Menu position="right">
                <Dropdown
                    item
                    icon={getFilterIcon(filter)}
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
                    icon={getTypeIcon(type)}
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
