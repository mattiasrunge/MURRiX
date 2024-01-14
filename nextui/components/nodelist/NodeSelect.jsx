
import React from "react";
import PropTypes from "prop-types";
import { Search, Icon } from "semantic-ui-react";
import utils from "lib/utils";
import { api } from "lib/backend";
import useAsync from "hooks/useAsync.mjs";
import { NodeImage, NodeIcon } from "components/nodeparts";
import theme from "./theme.module.css";

const NodeSelect = ({ paths, limit, node, onChange, placeholder }) => {
    const [ query, setQuery ] = React.useState("");
    const [ selected, setSelected ] = React.useState(node);

    const onFocus = React.useCallback(async ({ target }) => {
        target.select();
    }, []);

    const onSearchChange = React.useCallback(async (d, { value }) => {
        if (selected) {
            setSelected(null);
        }

        setQuery(value);
    }, [ selected ]);

    const onKeyDown = React.useCallback((event) => {
        if (event.key === "Escape") {
            setSelected(node);
        }
    }, [ node ]);

    const onClear = React.useCallback(() => {
        setQuery("");
        setSelected(null);
        onChange(null);
    }, [ onChange ]);

    const load = React.useCallback(async () => {
        let list = [];

        if (selected) {
            list.push(await api.resolve(selected.path));
        } else {
            if (!query) {
                return [];
            }

            list = await api.list(paths, {
                search: query,
                limit: limit
            });
        }

        return list
        .slice(0, limit)
        .map((node) => ({
            key: node._id,
            title: node.attributes?.name ?? node.name,
            node
        }));
    }, [ selected, paths, limit, query ]);

    const { loading, value } = useAsync(load, []);

    const onResultSelect = React.useCallback(async (event, { result }) => {
        setSelected(result.node);
        onChange(result.node);
    }, [ onChange ]);

    React.useEffect(() => {
        if (selected) {
            setQuery(selected.attributes?.name ?? selected.name);
        }
    }, [ selected ]);

    return (
        <div className={theme.nodeInputWrapper}>
            <Search
                className={utils.classNames("item", theme.nodeInput, theme.nodeInputSearch, selected ? theme.nodeInputSearchSelected : null)}
                input={{
                    icon: "search",
                    iconPosition: "left",
                    transparent: true
                }}
                loading={loading}
                onSearchChange={onSearchChange}
                onResultSelect={onResultSelect}
                onFocus={onFocus}
                value={query}
                results={value}
                disabled={false}
                placeholder={placeholder}
                minCharacters={0}
                onKeyDown={onKeyDown}
                resultRenderer={({ node, title }) => (
                    <div className="content">
                        <NodeImage
                            theme={theme}
                            path={`${node.path}/profilePicture`}
                            format={{
                                width: 28,
                                height: 28,
                                type: "image"
                            }}
                            rounded
                        />
                        <div className="title">
                            <NodeIcon
                                theme={theme}
                                type={node.properties.type}
                            />
                            {title}
                        </div>
                    </div>
                )}
            />
            <If condition={query.length > 0}>
                <Icon
                    name="close"
                    className={theme.nodeInputClear}
                    link
                    onClick={onClear}
                />
            </If>
        </div>
    );
};

NodeSelect.defaultProps = {
    limit: 10,
    placeholder: "Search..."
};

NodeSelect.propTypes = {
    paths: PropTypes.array.isRequired,
    limit: PropTypes.number,
    node: PropTypes.object,
    onChange: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    placeholder: PropTypes.string
};

export default NodeSelect;
