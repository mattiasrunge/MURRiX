
import React from "react";
import Component from "lib/component";
import PropTypes from "prop-types";
import Textarea from "react-textarea-autosize";
import AuthWidgetPictureUser from "plugins/auth/components/widget-picture-user";
import AuthWidgetNameUser from "plugins/auth/components/widget-name-user";
import format from "lib/format";
import ko from "knockout";
import api from "api.io-client";
import stat from "lib/status";
import session from "lib/session";

class CommentWidgetComments extends Component {
    constructor(props) {
        super(props);

        this.state = {
            path: ko.unwrap(this.props.path),
            rows: ko.unwrap(props.rows),
            user: ko.unwrap(session.user),
            list: [],
            filtered: [],
            comment: "",
            collapsed: ko.unwrap(props.rows) > 0,
            loading: false
        };
    }

    componentDidMount() {
        if (ko.isObservable(this.props.path)) {
            this.addDisposables([
                this.props.path.subscribe((path) => this.load(path))
            ]);
        }

        this.addDisposables([
            session.user.subscribe((user) => this.setState({ user }))
        ]);

        const subscription = api.comment.on("new", (data) => {
            console.log(data);
            console.log(data.path, this.state.path);

            if (data.path === this.state.path) {
                this.load(this.state.path);
            }
        });

        this.addDisposable({
            dispose: () => api.comment.off(subscription)
        });

        this.load(ko.unwrap(this.props.path));
    }

    componentWillReceiveProps(nextProps) {
        if (ko.unwrap(this.props.path) !== ko.unwrap(nextProps.path)) {
            this.load(ko.unwrap(nextProps.path));
        }
    }

    getFilteredList(list) {
        if (this.state.rows === 0 || !this.state.collapsed) {
            return list;
        }

        return list.slice(-this.state.rows);
    }

    async load(abspath) {
        if (!abspath) {
            return this.setState({ list: [], filtered: [], loading: false });
        }

        try {
            this.setState({ loading: true });

            const list = await api.comment.list(abspath);
            const filtered = this.getFilteredList(list);

            console.log("comments", list, filtered);

            this.setState({ list, filtered, loading: false });
        } catch (error) {
            stat.printError(error);
            this.setState({ list: [], filtered: [], loading: false });
        }
    }

    async onKeyPress(event) {
        try {
            if (event.which === 13 && !event.shiftKey) {
                await api.comment.comment(this.state.path, this.state.comment);
                this.setState({ comment: "" });
                await this.load(this.state.path);
            }
        } catch (error) {
            stat.printError(error);
        }
    }

    onExpand(event) {
        event.preventDefault();

        this.setState({
            collapsed: false,
            filtered: this.state.list
        });
    }

    onChange(event) {
        this.setState({ comment: event.target.value });
    }

    render() {
        return (
            <div className="comments">
                <If condition={this.state.collapsed && this.state.list.length > this.state.filtered.length}>
                    <a
                        className="show-all-link"
                        href="#"
                        onClick={(e) => this.onExpand(e)}
                    >
                        Show all comments ({this.state.list.length})
                    </a>
                </If>

                <For each="item" of={this.state.filtered}>
                    <div className="row" key={item.node._id}>
                        <div className="col-md-12">
                            <AuthWidgetPictureUser
                                size={30}
                                uid={item.node.properties.birthuid}
                                classes="rounded-circle comment-picture-user float-left"
                            />
                            <p style={{ whiteSpace: "pre-line", display: "inline-block" }}>
                                <strong style={{ marginRight: 5 }}>
                                    <AuthWidgetNameUser
                                        uid={item.node.properties.birthuid}
                                    />
                                </strong>
                                {" "}
                                {item.node.attributes.text}
                                <small className="text-muted" style={{ display: "block" }}>
                                    {format.datetimeAgo(item.node.properties.birthtime)}
                                </small>
                            </p>
                        </div>
                    </div>
                </For>
                <div className="row">
                    <div className="col-md-12">
                        <Textarea
                            className="form-control"
                            style={{ marginTop: "5px", resize: "none" }}
                            rows="1"
                            placeholder="Leave a comment..."
                            value={this.state.comment}
                            onKeyPress={(event) => this.onKeyPress(event)}
                            onChange={(event) => this.onChange(event)}
                            disabled={this.state.loading}
                        ></Textarea>
                    </div>
                </div>
            </div>

        );
    }
}

CommentWidgetComments.defaultType = {
    rows: 0
};

CommentWidgetComments.propTypes = {
    rows: PropTypes.any,
    path: PropTypes.any
};

export default CommentWidgetComments;
