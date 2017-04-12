
import React from "react";

let instanceCounter = 0;

class Component extends React.PureComponent {
    constructor(props) {
        super(props);

        this.debug = false;
        this.id = instanceCounter++;
        this.disposables = [];

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

    addDisposable(disposable) {
        this.disposables.push(disposable);
    }

    addDisposables(disposables) {
        for (const disposable of disposables) {
            this.addDisposable(disposable);
        }
    }

    componentWillUnmount() {
        for (const disposable of this.disposables) {
            disposable.unsubscribe && disposable.unsubscribe();
            disposable.dispose && disposable.dispose();
        }

        this.disposables = [];
    }
}

export default Component;
