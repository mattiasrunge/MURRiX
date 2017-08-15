
import debounce from "debounce";
import api from "api.io-client";
import loc from "lib/location";
import ui from "lib/ui";
import stat from "lib/status";
import React from "react";
import Component from "lib/component";
import NodeWidgetCardList from "plugins/node/components/widget-card-list";
import ReactBootstrapSlider from "react-bootstrap-slider";

class SearchPageYear extends Component {
    constructor(props) {
        super(props);

        this.state = {
            year: parseInt(loc.get("year", new Date().getFullYear()), 10),
            list: []
        };

        this.loadDebounced = debounce(this.load.bind(this), 300);
    }

    componentDidMount() {
        this.addDisposables([
            loc.subscribe((params) => {
                const year = parseInt(params.year, 10) || new Date().getFullYear();

                if (year !== this.state.year) {
                    this.setState({ year });
                    this.loadDebounced(year);
                }
            })
        ]);

        this.loadDebounced(this.state.year);
    }

    async load(year) {
        try {
            ui.setTitle(`Browsing ${year}`);

            const list = await api.search.findByYear(year);

            this.setState({ list });
        } catch (error) {
            stat.printError(error);
            this.setState({ list: [] });
        }
    }

    onChange(event) {
        loc.goto({ year: event.target.value });
    }

    onYearIncClick(event) {
        event.preventDefault();

        loc.goto({ year: this.state.year + 1 });
    }

    onYearDecClick(event) {
        event.preventDefault();

        loc.goto({ year: this.state.year - 1 });
    }

    render() {
        return (
            <div className="fadeInRight animated">
                <div className="box box-content">
                    <h1>Search by year</h1>

                    <div style={{ marginBottom: "25px" }}>
                        <div style={{ textAlign: "center" }}>
                            Showing {this.state.year}
                        </div>

                        <a
                            href="#"
                            className="float-right btn btn-primary"
                            onClick={(e) => this.onYearIncClick(e)}
                        >
                            <i className="material-icons">add</i>
                        </a>
                        <a
                            href="#"
                            className="float-left btn btn-primary"
                            onClick={(e) => this.onYearDecClick(e)}
                        >
                            <i className="material-icons">remove</i>
                        </a>

                        <div className="year-slider">
                            <ReactBootstrapSlider
                                value={this.state.year}
                                slideStop={(e) => this.onChange(e)}
                                step={1}
                                min={1600}
                                max={new Date().getFullYear()}
                                tooltip="always"
                            />
                        </div>
                    </div>
                    {/* <div style={{ marginBottom: "15px" }}>
                        <div className="btn-group btn-group-justified" role="group">
                            <a type="button" className="btn btn-secondary">Jan</a>
                            <a type="button" className="btn btn-secondary">Feb</a>
                            <a type="button" className="btn btn-secondary">Mar</a>
                            <a type="button" className="btn btn-secondary">Apr</a>
                            <a type="button" className="btn btn-secondary">May</a>
                            <a type="button" className="btn btn-secondary">Jun</a>
                            <a type="button" className="btn btn-secondary">Jul</a>
                            <a type="button" className="btn btn-secondary">Aug</a>
                            <a type="button" className="btn btn-secondary">Sep</a>
                            <a type="button" className="btn btn-secondary">Oct</a>
                            <a type="button" className="btn btn-secondary">Nov</a>
                            <a type="button" className="btn btn-secondary">Dec</a>
                        </div>
                    </div> */}
                </div>

                <NodeWidgetCardList
                    list={this.state.list}
                />
            </div>
        );
    }
}

export default SearchPageYear;
