
import React from "react";
import ReactDOM from "react-dom";
import ko from "knockout";

class KnockoutWrapper extends React.PureComponent {
    componentDidMount() {
        this.setRef(ReactDOM.findDOMNode(this));
    }

    setRef(ref) {
        this.ref && ko.cleanNode(this.ref);
        this.ref = ref;

        ko.applyBindings(this.props, this.ref);

        this.props.afterRender && this.props.afterRender();
    }

    dispose() {
        this.props.dispose && this.props.dispose();

        this.ref && ko.cleanNode(this.ref);
        delete this.ref;
    }

    componentWillUnmount() {
        this.dispose();
    }

    render() {
        return this.props.children;
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
