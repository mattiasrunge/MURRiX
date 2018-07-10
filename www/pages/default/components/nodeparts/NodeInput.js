
import React from "react";
import PropTypes from "prop-types";
import api from "api.io-client";
import notification from "lib/notification";
import Component from "lib/component";
import { Search, Ref } from "semantic-ui-react";
import NodeImage from "./NodeImage";
import NodeIcon from "./NodeIcon";

class NodeInput extends Component {
    constructor(props) {
        super(props);

        const selected = props.value ? {
            title: props.value.attributes.name,
            key: props.value._id,
            node: props.value
        } : null;

        this.state = {
            selected,
            list: selected ? [ selected ] : [],
            searchQuery: selected ? selected.title : "",
            loading: false
        };
    }

    componentDidUpdate(prevProps) {
        if (prevProps.value !== this.props.value) {
            const selected = this.props.value ? {
                title: this.props.value.attributes.name,
                key: this.props.value._id,
                node: this.props.value
            } : null;

            this.setState({
                selected,
                list: selected ? [ selected ] : [],
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
                const all = await api.vfs.list(this.props.paths, {
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
        this.ref = ref.getElementsByTagName("INPUT")[0];
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
                    className={this.classNames("item", this.props.theme.nodeInput, this.props.className, this.props.theme.nodeInputSearch, this.state.selected ? this.props.theme.nodeInputSearchSelected : null)}
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
                    resultRenderer={(props) => (
                        <div className="content">
                            <NodeImage
                                theme={this.props.theme}
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
                                    theme={this.props.theme}
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
    icon: "search"
};

NodeInput.propTypes = {
    theme: PropTypes.object.isRequired,
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
    onBlur: PropTypes.func
};

export default NodeInput;