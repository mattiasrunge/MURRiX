
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import api from "api.io-client";

class Node extends Component {
    constructor(props) {
        super(props);

        this.state = {
            node: false
        };
    }

    async load() {
        this.setFromMatch(this.props.match);
    }

    componentWillReceiveProps(nextProps) {
        this.setFromMatch(nextProps.match);
    }

    async setFromMatch(match) {
        const path = match.url.replace(/^\/node/, "");

        if (this.state.node && this.state.node.path === path) {
            return;
        }

        try {
            const node = await api.vfs.resolve(path);

            this.setState({ node });
        } catch (error) {
            console.error(error);
            this.setState({ node: false });
        }
    }

    render() {
        return (
            <div className={this.props.theme.nodeContainer}>
                <pre>
                    {JSON.stringify(this.state.node, null, 2)}
                </pre>
            </div>
        );
    }
}

Node.propTypes = {
    theme: PropTypes.object,
    match: PropTypes.object.isRequired
};

export default Node;
