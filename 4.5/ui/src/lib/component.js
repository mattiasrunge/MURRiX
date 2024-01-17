
import React from "react";

let instanceCounter = 0;

class Component extends React.PureComponent {
    constructor(props) {
        super(props);

        this.debug = false;
        this.id = instanceCounter++;
        this.disposables = [];
        this.disposed = false;

        this.log("Component Constructor");
    }

    setDebug(debug = true) {
        this.debug = debug;
    }

    log(...args) {
        if (this.debug) {
            console.log(`${this.constructor.name}[${this.id}]`, ...args);
        }
    }

    logError(...args) {
        console.error(`${this.constructor.name}[${this.id}]`, ...args);
    }

    classNames(...args) {
        return args
        .filter((name) => name)
        .join(" ");
    }

    addDisposable(disposable) {
        this.disposables.push(disposable);
    }

    addDisposables(disposables) {
        for (const disposable of disposables) {
            this.addDisposable(disposable);
        }
    }

    async load() {}

    componentDidMount() {
        this.disposed = false;

        this.load()
        .catch((error) => {
            this.logError(error);
        });
    }

    componentWillUnmount() {
        this.disposed = true;

        for (const disposable of this.disposables) {
            disposable.unsubscribe && disposable.unsubscribe();
            disposable.dispose && disposable.dispose();
        }

        this.disposables = [];
    }
}

export default Component;
