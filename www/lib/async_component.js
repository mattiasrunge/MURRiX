
import Component from "./component";

class StaleLoadError extends Error {
    constructor(message) {
        super(message);
        this.message = message;
        this.name = "StaleLoadError";
        this.staleLoadError = true;
    }
}

class AsyncComponent extends Component {
    constructor(props) {
        super(props);

        this.loadCounter = 0;

        this.state = {
            ...this.getInitialState(props),
            loading: false
        };

        this.log("AsyncComponent Constructor");
    }

    getInitialState(/* props */) {
        return {};
    }

    onLoadError(error) {
        console.error(error);
    }

    async load(/* props, w */) {
    }

    mount() {
    }

    umount() {
    }

    checkShouldUpdate(nextProps) {
        // https://github.com/developit/preact-compat/blob/7c5de00e7c85e2ffd011bf3af02899b63f699d3a/src/index.js#L349
        for (const i in nextProps) {
            if (!(i in this.props)) {
                return true;
            }
        }

        for (const i in this.props) {
            if (nextProps[i] !== this.props[i]) {
                return true;
            }
        }

        return false;
    }

    _getWrapper() {
        const id = ++this.loadCounter;

        return async (promise) => {
            try {
                const value = await promise;

                if (id === this.loadCounter) {
                    return value;
                }
            } catch (error) {
                if (id === this.loadCounter) {
                    throw error;
                }
            }

            throw new StaleLoadError(`Stale load id ${id}, current is ${this.loadCounter}`);
        };
    }

    componentDidMount() {
        this.mount();
        this._load(this.props);
    }

    componentWillUnmount() {
        this.umount();
        super.componentWillUnmount();
    }

    componentWillReceiveProps(nextProps) {
        if (this.checkShouldUpdate(nextProps)) {
            this._load(nextProps);
        }
    }

    async _load(props) {
        this.setState({ loading: true });
        const wrapper = this._getWrapper();

        try {
            const state = (await this.load(props, wrapper)) || {};

            this.setState({ ...state, loading: false });
        } catch (error) {
            if (!error.staleLoadError) {
                const state = this.onLoadError(error) || {};

                this.setState({ ...state, loading: false });
            }
        }
    }
}

export default AsyncComponent;
