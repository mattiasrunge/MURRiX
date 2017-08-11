
import React from "react";
import Knockout from "components/knockout";
import Comment from "components/comment";

const ko = require("knockout");

class NodeWidgetSections extends Knockout {
    async getModel() {
        const model = {};

        model.params = this.props.params;
        model.section = this.props.section;
        model.sections = this.props.sections;
        model.showShareSettings = this.props.showShareSettings || false;
        model.showUpload = ko.pureComputed(() => ko.unwrap(this.props.showUpload) || false);
        model.showMove = ko.pureComputed(() => ko.unwrap(this.props.showMove) || false);

        return model;
    }

    getTemplate() {
        return (
            <div>
                <div className="row">
                    <ul className="nav nav-pills" style={{ marginLeft: "15px", marginRight: "15px", marginTop: "15px", width: "100%" }}>
                        <Comment text="ko foreach: sections" />
                            <li className="nav-item" data-bind="css: { active: $root.section() === $data.name || ($index() === 0 && $root.section() === 'default'), 'mr-auto': $index() === $root.sections.length - 1 }">
                                <a className="nav-link" data-bind="location: { section: $data.name }">
                                    <i className="material-icons md-18" data-bind="text: $data.icon"></i>
                                    <span> </span>
                                    <span data-bind="text: $data.title"></span>
                                </a>
                            </li>
                        <Comment text="/ko" />

                        <li className="nav-item float-right" data-bind="visible: showMove, css: { active: $root.section() === 'move' }, tooltip: 'Move'" data-trigger="hover">
                            <a className="nav-link" data-bind="location: { section: 'move' }">
                                <i className="material-icons md-18" style={{ width: "18px" }}>folder</i>
                            </a>
                        </li>

                        <li className="nav-item float-right" data-bind="css: { active: $root.section() === 'comments' }, tooltip: 'Comments'" data-trigger="hover">
                            <a className="nav-link" data-bind="location: { section: 'comments' }">
                                <i className="material-icons md-18" style={{ width: "18px" }}>comments</i>
                            </a>
                        </li>
                        <li className="nav-item float-right" data-bind="visible: showUpload, css: { active: $root.section() === 'upload' }, tooltip: 'Upload files'" data-trigger="hover">
                            <a className="nav-link" data-bind="location: { section: 'upload' }">
                                <i className="material-icons md-18" style={{ width: "18px" }}>file_upload</i>
                            </a>
                        </li>
                        <li className="nav-item float-right" data-bind="visible: showShareSettings, css: { active: $root.section() === 'share' }, tooltip: 'Share settings'" data-trigger="hover">
                            <a className="nav-link" data-bind="location: { section: 'share' }">
                                <i className="material-icons md-18" style={{ width: "18px" }}>share</i>
                            </a>
                        </li>
                    </ul>
                </div>

                <div data-bind="foreach: sections">
                    <div data-bind="if: $root.section() === $data.name || ($index() === 0 && $root.section() === 'default')">
                        <div data-bind="react: { name: $data.react, params: $root.params }"></div>
                    </div>
                </div>
                <div data-bind="if: $root.section() === 'comments'">
                    <div data-bind="react: { name: 'node-section-comments', params: $root.params }"></div>
                </div>
                <div data-bind="if: $root.section() === 'upload' && showUpload()">
                    <div data-bind="react: { name: 'node-section-upload', params: $root.params }"></div>
                </div>
                <div data-bind="if: $root.section() === 'share' && showShareSettings">
                    <div data-bind="react: { name: 'node-section-share', params: $root.params }"></div>
                </div>
                <div data-bind="if: $root.section() === 'move' && showMove()">
                    <div data-bind="react: { name: 'node-section-move', params: $root.params }"></div>
                </div>
            </div>

        );
    }
}

export default NodeWidgetSections;