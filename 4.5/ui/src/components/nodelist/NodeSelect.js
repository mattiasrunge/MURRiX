
import React from "react";
import PropTypes from "prop-types";
import { Search, Icon } from "semantic-ui-react";
import utils from "lib/utils";
import { NodeImage, NodeIcon } from "components/nodeparts";
import { api } from "lib/backend";
import useAsync from "hooks/useAsync";
import theme from "./theme.module.css";

const NodeSelect = (props) => {
    const [ query, setQuery ] = React.useState("");
    const [ node, setNode ] = React.useState(props.node);

    const onFocus = React.useCallback(async ({ target }) => {
        target.select();
    });

    const onSearchChange = React.useCallback(async ({ target }, { value }) => {
        if (node) {
            setNode(null);
        }

        setQuery(value);
    });

    const onKeyDown = React.useCallback((event) => {
        if (event.key === "Escape") {
            setNode(props.node)
        }
    });

    const onClear = React.useCallback(() => {
        setQuery("");
        setNode(null);
        props.onChange(null);
    });

    const load = React.useCallback(async () => {
        let list = [];

        if (node) {
            list.push(await api.resolve(node.path));
        } else {
            if (!query) {
                return [];
            }

            list = await api.list(props.paths, {
                search: query,
                limit: props.limit
            });
        }

        return list
        .slice(0, props.limit)
        .map((node) => ({
            key: node._id,
            title: node.attributes?.name ?? node.name,
            node
        }));
    }, [ node, props.paths, props.limit, query ]);

    const { loading, value } = useAsync(load, []);

    const onResultSelect = React.useCallback(async (event, { result }) => {
        setNode(result.node);
        props.onChange(result.node);
    });

    React.useEffect(() => {
        if (node) {
            setQuery(node.attributes?.name ?? node.name);
        }
    }, [ node ]);

    return (
        <div className={theme.nodeInputWrapper}>
            <Search
                className={utils.classNames("item", theme.nodeInput, theme.nodeInputSearch, node ? theme.nodeInputSearchSelected : null)}
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
                placeholder={props.placeholder}
                minCharacters={0}
                onKeyDown={onKeyDown}
                resultRenderer={(props) => (
                    <div className="content">
                        <NodeImage
                            theme={theme}
                            path={`${props.node.path}/profilePicture`}
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
                                type={props.node.properties.type}
                            />
                            {props.title}
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
