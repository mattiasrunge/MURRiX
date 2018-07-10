
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import { Header, Segment, Button } from "semantic-ui-react";
import List from "./List";
import ui from "lib/ui";

class Name extends Component {
    constructor(props) {
        super(props);

        this.state = {
            letter: this.props.match.params.letter
        };

        this.letters = [];

        for (let code = 0; code < 26; code++) {
            this.letters.push(String.fromCharCode(65 + code));
        }

        this.letters.push(String.fromCharCode(197)); // Å
        this.letters.push(String.fromCharCode(196)); // Ä
        this.letters.push(String.fromCharCode(214)); // Ö
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.match.params.letter !== this.props.match.params.letter) {
            this.setState({ letter: nextProps.match.params.letter });
        }
    }

    onChange(letter) {
        const url = this.props.match.path.split(":")[0];

        this.context.router.history.replace(`${url}${letter}`);
    }

    render() {
        const currentLetter = this.props.match.params.letter || false;
        const query = currentLetter ? {
            options: {
                pattern: `${currentLetter}.*`
            },
            paths: [
                "/people",
                "/cameras",
                "/locations",
                "/albums"
            ]
        } : null;

        ui.setTitle(`Browsing name ${currentLetter || ""}`);

        return (
            <div>
                <Header>Browse by name</Header>
                <Segment>
                    <div className={this.props.theme.nameLetterContainer}>
                        <For each="letter" of={this.letters}>
                            <Button
                                key={letter}
                                className={this.props.theme.nameLetterButton}
                                content={letter}
                                basic={letter !== currentLetter}
                                color={letter === currentLetter ? "blue" : null}
                                size="mini"
                                active={letter === currentLetter}
                                onClick={() => this.onChange(letter)}
                            />
                        </For>
                    </div>
                </Segment>
                <List
                    theme={this.props.theme}
                    query={query}
                />
            </div>
        );
    }
}

Name.propTypes = {
    theme: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired
};

Name.contextTypes = {
    router: PropTypes.object.isRequired
};

export default Name;