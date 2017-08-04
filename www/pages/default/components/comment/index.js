
import React from "react";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";

class Comment extends React.Component {
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

Comment.defaultProps = {
    trim: true
};

Comment.propTypes = {
    text: PropTypes.string,
    trim: PropTypes.bool
};

export default Comment;
