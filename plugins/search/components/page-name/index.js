
import debounce from "debounce";
import api from "api.io-client";
import loc from "lib/location";
import ui from "lib/ui";
import stat from "lib/status";
import session from "lib/session";
import React from "react";
import { Badge } from "reactstrap";
import Component from "lib/component";
import NodeWidgetCardList from "plugins/node/components/widget-card-list";

class SearchPageName extends Component {
    constructor(props) {
        super(props);

        this.letters = [];

        for (let n = 0; n < 26; n++) {
            this.letters.push(String.fromCharCode(65 + n));
        }

        this.letters.push(String.fromCharCode(197)); // Å
        this.letters.push(String.fromCharCode(196)); // Ä
        this.letters.push(String.fromCharCode(214)); // Ö

        this.state = {
            letter: loc.get("letter"),
            list: []
        };

        this.loadDebounced = debounce(this.load.bind(this), 300);
    }

    componentDidMount() {
        this.addDisposables([
            loc.subscribe((params) => {
                const letter = params.letter || "";

                if (letter !== this.state.letter) {
                    this.setState({ letter });
                    this.load(letter);
                }
            })
        ]);

        this.loadDebounced(this.state.letter);
    }

    async load(letter) {
        try {
            ui.setTitle(`Browsing for names beginning with ${letter}`);

            if (!letter) {
                return this.setState({ list: [] });
            }

            const options = {
                filter: {
                    "attributes.name": { $regex: `^${letter}.*`, $options: "-i" }
                }
            };

            const list = await api.vfs.list(session.searchPaths(), options);

            this.setState({ list });
        } catch (error) {
            stat.printError(error);
            this.setState({ list: [] });
        }
    }

    onClick(event, letter) {
        event.preventDefault();

        loc.goto({ letter: letter || null });
    }

    render() {
        return (
            <div className="fadeInRight animated">
                <div className="page-header">
                    <h1>Browse by name</h1>
                </div>
                <div className="box box-content">
                    <div style={{ marginBottom: 5, textAlign: "center" }}>
                        <For each="item" of={this.letters}>
                            <Badge
                                key={item}
                                pill={true}
                                color={item === this.state.letter ? "primary" : "none"}
                                style={{ marginRight: 4, marginBottom: 10, cursor: "pointer" }}
                                onClick={(e) => this.onClick(e, item)}
                            >
                                {item}
                            </Badge>
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

export default SearchPageName;
