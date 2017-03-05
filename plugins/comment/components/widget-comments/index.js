
import React from "react";
import Knockout from "components/knockout";
import Comment from "components/comment";

const ko = require("knockout");
const utils = require("lib/utils");
const api = require("api.io-client");
const stat = require("lib/status");
const session = require("lib/session");

class CommentWidgetComments extends Knockout {
    async getModel() {
        const model = {};

        model.loading = stat.create();
        model.path = ko.pureComputed(() => ko.unwrap(this.props.path));
        model.user = session.user;
        model.uid = ko.pureComputed(() => {
            if (!model.user()) {
                return false;
            }

            return model.user().attributes.uid;
        });
        model.rows = ko.pureComputed(() => ko.unwrap(this.props.rows) || 0);
        model.list = ko.observableArray();
        model.comment = ko.observable("");
        model.collapsed = ko.observable(model.rows() > 0);

        model.filtered = ko.pureComputed(() => {
            if (model.rows() === 0 || !model.collapsed()) {
                return model.list();
            }

            return model.list().slice(-model.rows());
        });

        model.post = (model, event) => {
            if (event.keyCode === 13 && !event.shiftKey) {
                model.loading(true);
                api.comment.comment(model.path(), model.comment())
                .then(() => {
                    model.loading(false);
                    model.comment("");
                })
                .catch((error) => {
                    model.loading(false);
                    stat.printError(error);
                });

                return false;
            }

            return true;
        };

        model.loading(true);
        let list = await api.comment.list(model.path());
        model.loading(false);

        console.log("comments", list);

        model.list(list.map((item) => {
            item.node = ko.observable(item.node);
            return item;
        }));

        let subscription = api.comment.on("new", (data) => {
            console.log(data);
            console.log(data.path, model.path());

            if (data.path === model.path()) {
                model.list.push({
                    name: data.name,
                    path: data.path,
                    node: ko.observable(data.node)
                });
            }
        });

        model.dispose = () => {
            api.comment.off(subscription);
            stat.destroy(model.loading);
        };


        return model;
    }

    getTemplate() {
        return (
            <div className="comments">
                <a className="show-all-link" href="#" data-bind="visible: list().length > filtered().length, click: collapsed.bind($data, false)">Show all comments</a>

                <div data-bind="foreach: filtered">
                    <div className="row">
                        <div className="col-md-12">
                            <div data-bind="react: { name: 'auth-widget-picture-user', params: { size: 30, uid: $data.node().properties.birthuid, classes: 'rounded-circle comment-picture-user' } }" className="float-left"></div>
                            <div className="name" data-bind="unameNice: $data.node().properties.birthuid"></div>
                            <small className="text-muted" data-bind="datetimeAgo: $data.node().properties.birthtime"></small>
                            <p style={{ whiteSpace: "pre-line" }} data-bind="text: $data.node().attributes.text"></p>
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-12">
                        <textarea style={{ marginTop: "5px", resize: "none" }} rows="1" className="form-control" data-bind="textInput: comment, event: { keypress: post }, autosize: comment, disable: loading" placeholder="Leave a comment..."></textarea>
                    </div>
                </div>
            </div>

        );
    }
}

export default CommentWidgetComments;
