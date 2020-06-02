
import React from "react";
import PropTypes from "prop-types";
import { Header, Icon } from "semantic-ui-react";
import Component from "lib/component";
import { NodeImage } from "components/nodeparts";
import theme from "./theme.module.css";

class PageHeader extends Component {
    render() {
        return (
            <div className={theme.header}>
                <Choose>
                    <When condition={this.props.profilePath}>
                        <NodeImage
                            path={this.props.profilePath}
                            format={{
                                width: 50,
                                height: 50,
                                type: "image"
                            }}
                            avatar
                            floated="right"
                        />
                    </When>
                    <When condition={this.props.icon}>
                        <Icon
                            name={this.props.icon}
                            size="big"
                            style={{
                                float: "right",
                                marginLeft: 20,
                                marginBottom: 20
                            }}
                        />
                    </When>
                </Choose>

                <Header as="h2">
                    {this.props.extra}

                    {this.props.title}
                    <Header.Subheader>
                        {this.props.subtitle}
                    </Header.Subheader>
                </Header>
            </div>
        );
    }
}

PageHeader.propTypes = {
    icon: PropTypes.string,
    profilePath: PropTypes.string,
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string.isRequired,
    extra: PropTypes.any
};

export default PageHeader;
