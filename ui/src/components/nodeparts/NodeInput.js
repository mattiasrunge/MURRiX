
import React from "react";
import PropTypes from "prop-types";
import { Search, Ref } from "semantic-ui-react";
import { api } from "lib/backend";
import notification from "lib/notification";
import Component from "lib/component";
import NodeImage from "./NodeImage";
import NodeIcon from "./NodeIcon";
import theme from "./theme.module.css";

class NodeInput extends Component {
    constructor(props) {
        super(props);

        const selected = props.value ? this.toListItem(props.value) : null;

        this.state = {
            selected,
            list: selected ? [ selected ] : props.suggestions.map(this.toListItem),
            searchQuery: selected ? selected.title : "",
            loading: false
        };
    }

    toListItem = (node) => {
        return {
            title: node.attributes.name,
            key: node._id,
            node
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps.value !== this.props.value || prevProps.suggestions !== this.props.suggestions) {
            const selected = this.props.value ? this.toListItem(this.props.value) : null;

            this.setState({
                selected,
                list: selected ? [ selected ] : this.props.suggestions.map(this.toListItem),
                searchQuery: selected ? selected.title : ""
            });
        }
    }

    onSearch = (e, { value }) => {
        this.searchTimer && clearTimeout(this.searchTimer);

        if (this.props.value !== null) {
            this.props.onChange(null);
        }

        this.setState({ searchQuery: value, list: [], loading: true });

        this.searchTimer = setTimeout(async () => {
            if (this.state.searchQuery !== value) {
                return;
            }

            try {
                const all = await api.list(this.props.paths, {
                    search: value,
                    limit: this.props.limit
                });

                const list = all
                .slice(0, this.props.limit)
                .map((node) => ({
                    title: node.attributes.name,
                    key: node._id,
                    node
                }));

                // all.sort((a, b) => a.title.localeCompare(b.title));

                this.setState({
                    list,
                    loading: false
                });
            } catch (error) {
                this.logError("Failed to run search", error);
                notification.add("error", error.message, 10000);
                this.setState({ loading: false });
            }
        }, 500);
    }

    onSelect = async (e, { result }) => {
        const ret = await Promise.resolve(this.props.onChange(result.node));

        if (ret === false) {
            this.setState({
                selected: null,
                searchQuery: "",
                list: [ ]
            });
        } else {
            this.setState({
                selected: result,
                searchQuery: result.title,
                list: [ result ]
            });
        }
    }

    onRef = (ref) => {
        this.ref = ref ? ref.querySelector("input") : null;
    }

    onFocus = () => {
        this.ref && this.ref.select();
        this.props.onFocus && this.props.onFocus();
    }

    onBlur = () => {
        this.props.onBlur && this.props.onBlur();
    }

    onKeyUp = (e) => {
        this.props.onKeyUp && this.props.onKeyUp(e, this.state.searchQuery);
    }

    render() {
        return (
            <Ref innerRef={(ref) => this.onRef(ref)}>
                <Search
                    className={this.classNames("item", theme.nodeInput, this.props.className, theme.nodeInputSearch, this.state.selected ? theme.nodeInputSearchSelected : null)}
                    input={{
                        icon: this.props.icon,
                        iconPosition: this.props.iconPosition,
                        transparent: this.props.transparent
                    }}
                    loading={this.props.loading || this.state.loading}
                    onSearchChange={this.onSearch}
                    onResultSelect={this.onSelect}
                    value={this.state.searchQuery}
                    results={this.state.list}
                    disabled={this.props.disabled}
                    onFocus={this.onFocus}
                    onBlur={this.onBlur}
                    onKeyUp={this.onKeyUp}
                    size={this.props.size}
                    placeholder={this.props.placeholder}
                    minCharacters={0}
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
            </Ref>
        );
    }
}

NodeInput.defaultProps = {
    limit: 10,
    icon: "search",
    suggestions: []
};

NodeInput.propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
    disabled: PropTypes.bool,
    value: PropTypes.object,
    onChange: PropTypes.func.isRequired,
    paths: PropTypes.array.isRequired,
    limit: PropTypes.number,
    onKeyUp: PropTypes.func,
    iconPosition: PropTypes.string,
    icon: PropTypes.string,
    transparent: PropTypes.bool,
    size: PropTypes.string,
    loading: PropTypes.bool,
    placeholder: PropTypes.string,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    suggestions: PropTypes.array
};

export default NodeInput;
