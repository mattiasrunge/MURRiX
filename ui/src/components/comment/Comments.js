
import React from "react";
import PropTypes from "prop-types";
import { Comment, Form, Button } from "semantic-ui-react";
import Component from "lib/component";
import { cmd } from "lib/backend";
import format from "lib/format";
import { NodeImage } from "components/nodeparts";
import theme from "./theme.module.css";

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

    componentDidUpdate(prevProps) {
        if (this.props.path !== prevProps.path) {
            this.update(this.props);
        }
    }

    async update(props) {
        this.setState({ loading: true });

        try {
            const comments = await cmd.comments(props.path);

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
            await cmd.comment(this.props.path, this.state.comment);

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
                        className={theme.commentTextArea}
                        value={this.state.comment}
                        disabled={this.state.saving}
                        onChange={this.onChange}
                        placeholder="Leave a comment..."
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
    path: PropTypes.string.isRequired
};

export default Comments;
