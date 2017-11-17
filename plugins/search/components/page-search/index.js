
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
            query: loc.get("query"),
            list: []
        };
    }

    componentDidMount() {
        this.addDisposables([
            loc.subscribe((params) => {
                const query = params.query || "";

                if (query !== this.state.query) {
                    this.setState({ query });
                    this.loadDebounced(query);
                }
            })
        ]);

        this.loadDebounced(this.state.query);
    }

    loadDebounced(query) {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        this.timeout = setTimeout(() => this.load(query), 300);
    }

    async load(query) {
        try {
            ui.setTitle(`Searched for ${query}`);

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
                <div className="page-header">
                    <h1>Search</h1>
                </div>
                <div className="box box-content">
                    <form className="form" role="search" style={{ marginBottom: 15 }} onSubmit={(e) => e.preventDefault()}>
                        <input
                            name="query"
                            type="search"
                            className="form-control"
                            style={{ marginBottom: 15 }}
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
