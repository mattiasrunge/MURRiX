
import React from "react";
import ReactDOM from "react-dom";

class Comment extends React.Component {
    static propTypes = {
        text: React.PropTypes.string,
        trim: React.PropTypes.bool
    };

    static defaultProps = {
        trim: true
    };

    componentDidMount() {
        const el = ReactDOM.findDOMNode(this);
        ReactDOM.unmountComponentAtNode(el);
        el.outerHTML = this.createComment();
    }

    createComment() {
        let text = this.props.text;

        if (this.props.trim) {
            text = text.trim();
        }

        return `<!-- ${text} -->`;
    }

    render() {
        return <div />;
    }
}

export default Comment;
