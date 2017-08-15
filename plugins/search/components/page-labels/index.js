
import debounce from "debounce";
import api from "api.io-client";
import loc from "lib/location";
import ui from "lib/ui";
import stat from "lib/status";
import session from "lib/session";
import React from "react";
import Component from "lib/component";
import NodeWidgetCardList from "plugins/node/components/widget-card-list";

class SearchPageLabels extends Component {
    constructor(props) {
        super(props);

        this.state = {
            labels: [],
            query: loc.get("query"),
            list: []
        };

        this.loadDebounced = debounce(this.load.bind(this), 300);
    }

    componentDidMount() {
        this.addDisposables([
            loc.subscribe((params) => {
                const query = params.query || "";

                if (query !== this.state.query) {
                    this.setState({ query });
                    this.load(query);
                }
            })
        ]);

        api.vfs.labels()
            .then((labels) => {
                this.setState({ labels });
            })
            .catch((error) => {
                stat.printError(error);
            });

        this.loadDebounced(this.state.query);
    }

    async load(query) {
        try {
            ui.setTitle(`Search for label ${query}`);

            const labels = query.split("+");

            if (labels.length === 0) {
                return this.setState({ list: [] });
            }

            const options = {
                filter: {
                    "attributes.labels": { $in: labels }
                }
            };

            const list = await api.vfs.list(session.searchPaths(), options);

            this.setState({ list });
        } catch (error) {
            stat.printError(error);
            this.setState({ list: [] });
        }
    }

    onClick(event, label) {
        event.preventDefault();

        loc.goto({ query: label });
    }

    render() {
        return (
            <div className="fadeInRight animated">
                <div className="box box-content">
                    <h1>Browse by label</h1>

                    <div style={{ marginBottom: "15px" }}>
                        <For each="item" of={this.state.labels}>
                            <a
                                key={item}
                                role="button"
                                className={`btn btn-sm ${item === this.state.query ? "btn-primary" : "btn-secondary"}`}
                                style={{ marginRight: "5px", marginBottom: "10px" }}
                                onClick={(e) => this.onClick(e, item)}
                            >
                                {item}
                            </a>
                        </For>
                    </div>
                </div>

                <NodeWidgetCardList
                    list={this.state.list}
                />
            </div>
        );
    }
}

export default SearchPageLabels;
