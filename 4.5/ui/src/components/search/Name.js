
import React from "react";
import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";
import { Segment, Button } from "semantic-ui-react";
import { Header } from "components/header";
import Component from "lib/component";
import ui from "lib/ui";
import List from "./List";
import theme from "./theme.module.css";

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

    componentDidUpdate(prevProps) {
        if (prevProps.match.params.letter !== this.props.match.params.letter) {
            this.setState({ letter: this.props.match.params.letter });
        }
    }

    onChange(letter) {
        const url = this.props.match.path.split(":")[0];

        this.props.history.replace(`${url}${letter}`);
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
                <Header
                    icon="keyboard outline"
                    title="Browse by name"
                    subtitle="Find content by first letter in name"
                />
                <Segment>
                    <div className={theme.nameLetterContainer}>
                        <For each="letter" of={this.letters}>
                            <Button
                                key={letter}
                                className={theme.nameLetterButton}
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
                    theme={theme}
                    query={query}
                />
            </div>
        );
    }
}

Name.propTypes = {
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired
};

export default withRouter(Name);
