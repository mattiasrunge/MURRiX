
import React from "react";
import Knockout from "components/knockout";

const ko = require("knockout");

class PeopleWidgetFamilyPerson extends Knockout {
    async getModel() {
        const model = {};

        model.data = ko.unwrap(this.props.data);
        model.zoom = this.props.zoom;


        return model;
    }

    getTemplate() {
        return (
            <table style={{ textAlign: "center" }} className="relation-table">
                <tbody>
                    <tr className="relation-parent-row" data-bind="if: data.tree.parents().length > 0, visible: data.tree.parentsVisible">
                        <td data-bind="foreach: data.tree.parents" style={{ whiteSpace: "nowrap", lineHeight: "normal", padding: "0px", margin: "0px", paddingLeft: "15px", paddingRight: "15px" }}><div style={{ display: "inline-block", verticalAlign: "bottom" }} data-bind="react: { name: 'people-widget-family-person', params: { data: $data, zoom: $root.zoom } }"></div></td>
                    </tr>
                    <tr>
                        <td style={{ lineHeight: "normal", padding: "0px" }}>
                            <span data-bind="if: data.tree.type === 'child'">
                                <div className="relation-horizontal-line-left" data-bind="css: { 'relation-horizontal-line-hide': data.tree.first }"></div>{/* 
                                 */}<div className="relation-horizontal-line-right" data-bind="css: { 'relation-horizontal-line-hide': data.tree.last }"></div>
                            </span>

                            <span data-bind="if: data.tree.parents().length > 0 || data.tree.type === 'child'">
                                <div style={{ height: "40px", width: "2px", backgroundColor: "#ccc", marginLeft: "auto", marginRight: "auto", marginTop: "-5px", overflow: "visible" }}>
                                    <button data-bind="visible: data.tree.type !== 'child', click: data.tree.expandParents" className="relation-expand relation-parent-expand">
                                        <i data-bind="visible: !data.tree.parentsVisible()" className="material-icons md-18">add</i>
                                        <i data-bind="visible: data.tree.parentsVisible()" className="material-icons md-18">remove</i>
                                    </button>
                                </div>
                            </span>

                            <div data-bind="css: { 'relation-me': data.tree.type === 'me' }" style={{ display: "inline-block", position: "relative" }}>

                                <div data-bind="style: { zoom: $root.zoom }" style={{ verticalAlign: "top", marginLeft: "auto", marginRight: "auto", width: "320px", height: "90px" }}>

                                    <div className="box-content relation-person-box-small" style={{ margin: "0px 15px 0px 15px", height: "90px", padding: "0px", position: "relative" }} data-bind="visible: $root.zoom() <= 0.7">

                                        <div className="relation-person-image-small">
                                            <span data-bind="react: { name: 'file-widget-profile-picture', params: { size: 88, path: data.tree.nodepath().path, nolazyload: true } }"></span>
                                        </div>

                                        <div className="relation-person-image-small-title" data-bind="css: { 'relation-person-title-male': data.attributes.gender === 'm', 'relation-person-title-female': data.attributes.gender === 'f' }">
                                            <a src="#" data-bind="location: { page: 'node', path: data.tree.nodepath().path }, text: data.attributes.name"></a>
                                        </div>
                                    </div>

                                    <div className="box-content relation-person-box" style={{ margin: "0px 15px 0px 15px", height: "90px", padding: "0px", position: "relative" }} data-bind="visible: $root.zoom() > 0.7">

                                        <div className="relation-person-image">
                                            <span data-bind="react: { name: 'file-widget-profile-picture', params: { size: 88, path: data.tree.nodepath().path, nolazyload: true } }"></span>
                                        </div>

                                        <div className="relation-person-title">
                                            <div className="relation-person-title-background" data-bind="css: { 'relation-person-title-male': data.attributes.gender === 'm', 'relation-person-title-female': data.attributes.gender === 'f' }"></div>
                                                <a src="#" data-bind="location: { page: 'node', path: data.tree.nodepath().path }, text: data.attributes.name"></a>
                                        </div>

                                        <div style={{ paddingLeft: "100px", fontSize: "12px" }}>
                                            <div data-bind="visible: data.tree.metrics().birthdate || data.tree.metrics().deathdate" style={{ marginBottom: "10px" }}>
                                                <i className="material-icons md-14">date_range</i>
                                                <span className="relation-person-birth" data-bind="visible: data.tree.metrics().birthdate, text: data.tree.metrics().birthdate"></span>
                                                <span className="relation-person-death" data-bind="visible: data.tree.metrics().deathdate">&mdash; <span data-bind="text: data.tree.metrics().deathdate"></span></span>
                                            </div>
                                            <div>
                                                <i className="material-icons md-14">favorite</i>
                                                <span data-bind="react: { name: 'people-widget-partner', params: { nodepath: data.tree.nodepath } }" className="relation-person-partner"></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <span data-bind="if: data.tree.children().length > 0 || data.tree.type === 'parent'">
                                <div style={{ height: "40px", width: "2px", backgroundColor: "#ccc", marginLeft: "auto", marginRight: "auto", marginBottom: "-13px", overflow: "visible" }}>
                                    <button data-bind="visible: data.tree.type !== 'parent', click: data.tree.expandChildren" className="relation-expand relation-child-expand">
                                        <i data-bind="visible: !data.tree.childrenVisible()" className="material-icons md-18">add</i>
                                        <i data-bind="visible: data.tree.childrenVisible()" className="material-icons md-18">remove</i>
                                    </button>
                                </div>
                            </span>

                            <span data-bind="if: data.tree.type === 'parent'">
                                <div className="relation-horizontal-line-left" data-bind="css: { 'relation-horizontal-line-hide': data.tree.first }"></div>{/* 
                                 */}<div className="relation-horizontal-line-right" data-bind="css: { 'relation-horizontal-line-hide': data.tree.last }"></div>
                            </span>
                        </td>
                    </tr>
                    <tr className="relation-child-row" data-bind="if: data.tree.children().length > 0, visible: data.tree.childrenVisible">
                        <td data-bind="foreach: data.tree.children" style={{ whiteSpace: "nowrap", lineHeight: "normal", padding: "0px", margin: "0px", paddingLeft: "15px", paddingRight: "15px" }}><div style={{ display: "inline-block", verticalAlign: "top" }} data-bind="react: { name: 'people-widget-family-person', params: { data: $data, zoom: $root.zoom } }"></div></td>
                    </tr>
                </tbody>
            </table>

        );
    }
}

export default PeopleWidgetFamilyPerson;
