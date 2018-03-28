
import React from "react";
import PropTypes from "prop-types";
import api from "api.io-client";
import notification from "lib/notification";
import Component from "lib/component";
import { Search, Ref } from "semantic-ui-react";
import NodeProfilePicture from "./NodeProfilePicture";
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
            list: selected ? [ selected ] : [],
            searchQuery: selected ? selected.title : "",
            loading: false
        };
    }

    componentWillReceiveProps(nextProps) {
        const selected = nextProps.value ? {
            title: nextProps.value.attributes.name,
            key: nextProps.value._id,
            node: nextProps.value
        } : null;

        this.setState({
            list: selected ? [ selected ] : [],
            searchQuery: selected ? selected.title : ""
        });
    }

    onSearch(searchQuery) {
        this.searchTimer && clearTimeout(this.searchTimer);

        if (this.props.value !== null) {
            this.props.onChange(null);
        }

        this.setState({ searchQuery, list: [], loading: true });

        this.searchTimer = setTimeout(async () => {
            try {
                const all = [];

                for (const path of this.props.paths) {
                    const list = await api.vfs.list(path, {
                        search: searchQuery,
                        limit: this.props.limit
                    });

                    all.push(...list.map((node) => ({
                        title: node.attributes.name,
                        key: node._id,
                        node
                    })));
                }

                // all.sort((a, b) => a.title.localeCompare(b.title));

                this.setState({
                    list: all.slice(0, this.props.limit),
                    loading: false
                });
            } catch (error) {
                this.logError("Failed to run search", error);
                notification.add("error", error.message, 10000);
                this.setState({ loading: false });
            }
        }, 500);
    }

    onSelect(selected) {
        this.props.onChange(selected.node);
        this.setState({ searchQuery: selected.title, list: [ selected ] });
    }

    onRef(ref) {
        this.ref = ref.getElementsByTagName("INPUT")[0];
    }

    onFocus() {
        this.ref && this.ref.select();
    }

    render() {
        return (
            <Ref innerRef={(ref) => this.onRef(ref)}>
                <Search
                    className={`item ${this.props.theme.nodeInput} ${this.props.theme.nodeInputSearch} ${this.props.value ? this.props.theme.nodeInputSearchSelected : ""}`}
                    input={{
                        icon: this.props.icon,
                        iconPosition: this.props.iconPosition
                    }}
                    loading={this.props.loading || this.state.loading}
                    onSearchChange={(e, { value }) => this.onSearch(value)}
                    onResultSelect={(e, { result }) => this.onSelect(result)}
                    value={this.state.searchQuery}
                    results={this.state.list}
                    disabled={this.props.disabled}
                    onFocus={() => this.onFocus()}
                    onKeyUp={(e) => this.props.onKeyUp(e, this.state.searchQuery)}
                    placeholder={this.props.placeholder}
                    resultRenderer={(props) => (
                        <div className="content">
                            <NodeProfilePicture
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
    children: PropTypes.node,
    disabled: PropTypes.bool,
    value: PropTypes.object,
    onChange: PropTypes.func.isRequired,
    paths: PropTypes.array.isRequired,
    limit: PropTypes.number,
    onKeyUp: PropTypes.func,
    iconPosition: PropTypes.string,
    icon: PropTypes.string,
    loading: PropTypes.bool,
    placeholder: PropTypes.string
};

export default NodeInput;
