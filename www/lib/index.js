
import React from "react";
import ReactDOM from "react-dom";
import ko from "knockout";

/* global window document location */




class Knockout extends React.PureComponent {
    setRef(ref) {
        this.ref = ref;

        ko.cleanNode(this.ref);

        ko.applyBindings(this.props, this.ref);
    }

    componentWillUnmount() {
        if (this.ref) {
            ko.cleanNode(this.ref);
            delete this.ref;
        }
    }

    render() {
        console.log("Knockout render");
        return (
            <span ref={this.setRef.bind(this)}>
                {this.props.children}
            </span>
        );
    }
}

class KnockoutComponent extends React.PureComponent {
    getModel() {
        return this.props;
    }

    getTemplate() {
        return "";
    }

    render() {
        console.log("KnockoutComponent render");

        return (
            <Knockout {...this.getModel()}>
                {this.getTemplate()}
            </Knockout>
        );
    }
}

class Widget extends KnockoutComponent {
    getTemplate() {
        console.log("Widget getTemplate");
        return (
            <div>
                Hej <span data-bind="text: name"></span>
            </div>
        );
    }
}

class App extends KnockoutComponent {
    getModel() {
        return {
            todos: this.props.todos
        };
    }

    getTemplate() {
        console.log("App getTemplate");

        return (
            <div>
                <ul data-bind="foreach: todos">
                    <li data-bind="text: $data"></li>
                </ul>
                <div data-bind="react: { name: 'widget', params: { name: 'Mattias' } }"></div>
                <div data-bind="react: 'widget'"></div>
            </div>
        );
    }
}

const components = {
    "widget": Widget
};

ko.bindingHandlers.react = {
    init: () => {
        return { controlsDescendantBindings: true };
    },
    update: (element, valueAccessor, allBindings) => {
        const data = ko.unwrap(valueAccessor());
        const { name, params } = typeof data === "object" ? data : { name: data, params: {} };
        const Component = components[ko.unwrap(name)];
        const Element = React.createElement(Component, params);

        ReactDOM.render(Element, element);
    }
};

window.onload = () => {
    const a = ko.observable("A");

    setInterval(() => {
        a(new Date().toString());
    }, 2000);

    ReactDOM.render((
        <App
            todos={[ a, "B" ]}
        />
    ), document.getElementById("main"));
};
