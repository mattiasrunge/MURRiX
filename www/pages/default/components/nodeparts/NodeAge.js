
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import api from "api.io-client";

class NodeAge extends Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            age: {}
        };
    }

    async load() {
        await this.update(this.props);
    }

    componentDidUpdate(prevProps) {
        if (this.props.node.path !== prevProps.node.path) {
            this.update(this.props);
        }
    }

    async update(props) {
        this.setState({ age: {}, loading: true });

        try {
            const age = await api.murrix.age(props.node.path);

            !this.disposed && this.setState({ age, loading: false });
        } catch (error) {
            // this.logError("Failed to get node url", error, 10000);
            !this.disposed && this.setState({ age: {}, loading: false });
        }
    }

    render() {
        return (
            <div>
                <span>
                    {this.state.age.birthdate}
                </span>
                <If condition={this.state.age.deathdate}>
                    <span>
                        &nbsp;{" "}&nbsp;
                        {"\u2014"}
                        &nbsp;{" "}&nbsp;
                    </span>
                    <span>
                        {this.state.age.deathdate}
                    </span>
                </If>
            </div>
        );
    }
}

NodeAge.propTypes = {
    theme: PropTypes.object,
    node: PropTypes.object.isRequired
};

export default NodeAge;
