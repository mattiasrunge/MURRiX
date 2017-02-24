
import React from "react";
import ko from "knockout";

class KnockoutWrapper extends React.PureComponent {
    setRef(ref) {
        this.ref = ref;

        ko.cleanNode(this.ref);

        ko.applyBindings(this.props, this.ref);

        if (this.props.afterRender) {
            this.props.afterRender();
        }
    }

    dispose() {
        if (this.props.dispose) {
            this.props.dispose();
        }

        if (this.ref) {
            ko.cleanNode(this.ref);
            delete this.ref;
        }
    }

    componentWillUnmount() {
        this.dispose();
    }

    render() {
        return (
            <span ref={this.setRef.bind(this)}>
                {this.props.children}
            </span>
        );
    }
}

class Knockout extends React.PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            model: false
        };
    }

    async getModel() {
        return this.props;
    }

    getTemplate() {
        return "";
    }

    componentDidMount() {
        this.getModel()
        .then((model) => {
            this.setState({
                model: model
            });
        })
        .catch((error) => {
            console.error("Failed to get model", error);
        });
    }

    render() {
        if (!this.state.model) {
            return null;
        }

        return (
            <KnockoutWrapper {...this.state.model}>
                {this.getTemplate()}
            </KnockoutWrapper>
        );
    }
}

export default Knockout;
