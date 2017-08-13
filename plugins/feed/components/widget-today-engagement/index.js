
import ko from "knockout";
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import format from "lib/format";
import loc from "lib/location";

class FeedWidgetTodayEngagement extends Component {
    constructor(props) {
        super(props);

        this.state = {
            nodepath: ko.unwrap(props.nodepath)
        };
    }

    componentDidMount() {
        if (ko.isObservable(this.props.nodepath)) {
            this.addDisposables([
                this.props.nodepath.subscribe((nodepath) => this.setState({ nodepath }))
            ]);
        }
    }

    onClick(event, path) {
        event.preventDefault();

        loc.goto({ page: "node", path: path }, false);
    }

    render() {
        return (
            <div>
                <i className="material-icons md-24">favorite_border</i>
                <div className="today-title">
                    <If condition={!this.state.nodepath.person2}>
                        <a
                            href="#"
                            onClick={(e) => this.onClick(e, this.state.nodepath.person1.path)}
                        >
                            {this.state.nodepath.person1.node.attributes.name}
                        </a>
                        <span> celebrates </span>
                        {this.state.nodepath.person1.node.attributes.gender === "m" ? "his" : "her"}
                        {" "}
                        {format.number(this.state.nodepath.years)}
                        <span> engagement anniversary</span>
                    </If>
                    <If condition={this.state.nodepath.person2}>
                        <a
                            href="#"
                            onClick={(e) => this.onClick(e, this.state.nodepath.person1.path)}
                        >
                            {this.state.nodepath.person1.node.attributes.name}
                        </a>
                        <span> and </span>
                        <a
                            href="#"
                            onClick={(e) => this.onClick(e, this.state.nodepath.person2.path)}
                        >
                            {this.state.nodepath.person2.node.attributes.name}
                        </a>
                        <span> celebrates their </span>
                        {format.number(this.state.nodepath.years)}
                        <span> engagement anniversary</span>
                    </If>
                </div>
            </div>

        );
    }
}

FeedWidgetTodayEngagement.propTypes = {
    nodepath: PropTypes.any
};

export default FeedWidgetTodayEngagement;
