
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import api from "api.io-client";
import format from "lib/format";
import { Comment, Form, Button } from "semantic-ui-react";
import { NodeImage } from "components/nodeparts";

class Comments extends Component {
    constructor(props) {
        super(props);

        this.state = {
            comments: [],
            comment: "",
            loading: false,
            saving: false
        };
    }

    async load() {
        await this.update(this.props);
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.path !== nextProps.path) {
            this.update(nextProps);
        }
    }

    async update(props) {
        this.setState({ loading: true });

        try {
            const comments = await api.murrix.comments(props.path);

            !this.disposed && this.setState({ comments, loading: false });
        } catch (error) {
            this.logError("Failed to load comments", error, 10000);
            !this.disposed && this.setState({ comments: [], loading: false });
        }
    }

    onChange = (e, { value }) => {
        this.setState({ comment: value });
    }

    onComment = async () => {
        this.setState({ saving: true });

        try {
            await api.murrix.comment(this.props.path, this.state.comment);

            !this.disposed && this.setState({ comment: "", saving: false });
            this.update(this.props);
        } catch (error) {
            this.logError("Failed to save comment", error, 10000);
            !this.disposed && this.setState({ saving: false });
        }
    }

    render() {
        return (
            <Comment.Group size="mini">
                <For each="comment" of={this.state.comments}>
                    <Comment key={comment.time}>
                        <span className="ui image circular avatar">
                            <NodeImage
                                path={comment.avatar}
                                format={{
                                    width: 28,
                                    height: 28,
                                    type: "image"
                                }}
                                type="u"
                            />
                        </span>
                        <Comment.Content>
                            <Comment.Author>
                                {comment.name}
                            </Comment.Author>
                            <Comment.Text>
                                <p>{comment.text}</p>
                            </Comment.Text>
                            <Comment.Metadata>
                                {format.datetimeAgo(comment.time)}
                            </Comment.Metadata>
                        </Comment.Content>
                    </Comment>
                </For>

                <Form reply>
                    <Form.TextArea
                        className={this.props.theme.commentTextArea}
                        value={this.state.comment}
                        disabled={this.state.saving}
                        onChange={this.onChange}
                        placeholder="Leave a comment..."
                        autoHeight
                        rows={1}
                    />
                    <Button
                        content="Post comment"
                        size="mini"
                        primary
                        fluid
                        loading={this.state.saving}
                        disabled={this.state.comment === ""}
                        onClick={this.onComment}
                    />
                </Form>
            </Comment.Group>
        );
    }
}

Comments.propTypes = {
    theme: PropTypes.object,
    path: PropTypes.string.isRequired
};

export default Comments;
