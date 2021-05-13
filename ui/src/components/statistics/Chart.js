
// Credits to https://github.com/reactjs/react-chartjs/issues/84

import React from "react";
import PropTypes from "prop-types";
import {
    Chart as ChartJS,
    BarElement,
    BarController,
    LinearScale,
    CategoryScale
} from 'chart.js';
import { Card } from "semantic-ui-react";
import Component from "lib/component";

ChartJS.register(
    BarElement,
    BarController,
    LinearScale,
    CategoryScale
  );
class Chart extends Component {
    constructor(props) {
        super(props);

        this.state = {
            chart: null
        };
    }

    componentDidMount() {
        this.createChart(this.props);
    }

    componentWillUnmount() {
        this.state.chart.destroy();
        super.componentWillUnmount();
    }

    createChart(props) {
        this.setState({
            chart: new ChartJS(this.ref.getContext("2d"), {
                type: props.type,
                data: props.data,
                options: props.options
            })
        });
    }

    onRef = (ref) => {
        this.ref = ref;
    }

    render() {
        return (
            <Card>
                <Card.Content>
                    <Card.Header>{this.props.data.label}</Card.Header>
                    <Card.Description style={{ marginTop: "2em" }}>
                        <canvas
                            ref={this.onRef}
                            height={this.props.height}
                            width={this.props.width}
                        />
                    </Card.Description>
                </Card.Content>
            </Card>
        );
    }
}

Chart.defaultProps = {
    options: ChartJS.defaults.global,
    type: "bar"
};


Chart.propTypes = {
    type: PropTypes.oneOf([ "bar", "line" ]),
    height: PropTypes.number,
    width: PropTypes.number,
    data: PropTypes.object,
    options: PropTypes.object
};

export default Chart;
