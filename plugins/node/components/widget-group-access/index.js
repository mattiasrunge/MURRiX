
import React from "react";
import Component from "lib/component";
import PropTypes from "prop-types";
import { Form, FormGroup, Input, Col } from "reactstrap";
import NodeWidgetNodeSelect from "plugins/node/components/widget-node-select";

class NodeWidgetGroupAccess extends Component {
    render() {
        return (
            <Form>
                <FormGroup row={true}>
                    <Col sm={9}>
                        <NodeWidgetNodeSelect
                            root={[ "/groups" ]}
                            path={this.props.path}
                            disabled={this.props.disabled}
                            placeholder="Select group"
                            onSelect={this.props.onGroupSelect}
                        />
                    </Col>
                    <Col sm={3}>
                        <Input
                            type="select"
                            value={this.props.access}
                            disabled={this.props.disabled}
                            onSelect={this.props.onAccessSelect}
                        >
                            <option value="read">Read</option>
                            <option value="write">Read and write</option>
                        </Input>
                    </Col>
                </FormGroup>
            </Form>
        );
    }
}

NodeWidgetGroupAccess.propTypes = {
    path: PropTypes.any,
    disabled: PropTypes.bool.isRequired,
    onGroupSelect: PropTypes.func.isRequired,
    access: PropTypes.any,
    onAccessSelect: PropTypes.func.isRequired
};

export default NodeWidgetGroupAccess;
