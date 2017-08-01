
import ko from "knockout";
import debounce from "debounce";
import api from "api.io-client";
import loc from "lib/location";
import ui from "lib/ui";
import stat from "lib/status";
import session from "lib/session";
import React from "react";
import Component from "lib/component";
import NodeWidgetCardList from "plugins/node/components/widget-card-list";

class SearchPageSearch extends Component {
    constructor(props) {
        super(props);

        this.state = {
            query: ko.unwrap(loc.current().query) || "",
            list: []
        };

        this.loadDebounced = debounce(this.load.bind(this), 300);
    }

    componentDidMount() {
        this.addDisposables([
            loc.current.subscribe((current) => {
                const query = current.query || "";

                if (query !== this.state.query) {
                    this.setState({ query });
                    this.loadDebounced(query);
                }
            })
        ]);

        this.loadDebounced(this.state.query);
    }

    async load(query) {
        try {
            ui.setTitle(`Search for ${query}`);

            if (!query) {
                return this.setState({ list: [] });
            }

            const options = {
                filter: {
                    "attributes.name": { $regex: `.*${query}.*`, $options: "-i" }
                }
            };

            const list = await api.vfs.list(session.searchPaths(), options);

            this.setState({ list });
        } catch (error) {
            stat.printError(error);
            this.setState({ list: [] });
        }
    }

    onChange(event) {
        event.preventDefault();

        loc.goto({ query: event.target.value });
    }

    render() {
        return (
            <div className="fadeInRight animated">
                <div className="box box-content">
                    <h1>Search by name</h1>

                    <form className="form" role="search" style={{ marginBottom: "15px" }} data-bind="submit: () => false">
                        <input
                            name="query"
                            type="search"
                            className="form-control"
                            style={{ marginBottom: "15px" }}
                            placeholder="Enter name to search for"
                            value={this.state.query}
                            onChange={(e) => this.onChange(e)}
                        />
                    </form>
                </div>

                <NodeWidgetCardList
                    list={this.state.list}
                />
            </div>
        );
    }
}

export default SearchPageSearch;
