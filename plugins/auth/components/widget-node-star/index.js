
import React from "react";
import Component from "lib/component";

const ko = require("knockout");
const api = require("api.io-client");
const stat = require("lib/status");
const session = require("lib/session");
const loc = require("lib/location");

class AuthWidgetNodeStar extends Component {
    constructor(props) {
        super(props);

        this.state = {
            page: ko.unwrap(loc.current().page) || "default",
            path: ko.unwrap(loc.current().path),
            stars: ko.unwrap(session.stars)
        };
    }

    componentDidMount() {
        this.addDisposables([
            loc.current.subscribe((current) => this.setState({
                page: current.page || "default",
                path: current.path
            })),
            session.stars.subscribe((stars) => this.setState({ stars }))
        ]);
    }

    toggleStar(event) {
        event.preventDefault();

        api.auth.toggleStar(this.state.path)
            .then((result) => {
                session.setStars(result.stars);

                if (result.created) {
                    stat.printSuccess("Star created");
                } else {
                    stat.printSuccess("Star removed");
                }
            })
            .catch((error) => {
                stat.printError(error);
            });
    }

    render() {
        const starred = this.state.stars.filter((node) => node.path === this.state.path).length > 0;

        return (
            <span>
                <If condition={this.state.page === "node"}>
                    <a
                        className="star"
                        href="#"
                        onClick={(e) => this.toggleStar(e)}
                    >
                        <Choose>
                            <When condition={starred}>
                                <i className="material-icons md-24">star</i>
                            </When>
                            <Otherwise>
                                <i className="material-icons md-24">star_border</i>
                            </Otherwise>
                        </Choose>
                    </a>
                </If>
            </span>
        );
    }
}

export default AuthWidgetNodeStar;
