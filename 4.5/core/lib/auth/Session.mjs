import store from "../store/index.mjs";

class Session {
    static async create(id, initialData = {}) {
        const storedData = (await store.get(`session-${id}`)) || {};
        const sessionData = {
            ...storedData,
            ...initialData,
            id
        };

        await store.set(`session-${id}`, sessionData);

        return new Session(sessionData);
    }

    constructor(sessionData) {
        let session = sessionData;

        return new Proxy(this, {
            get: (_target, name) => {
                if (name === "destroy") {
                    return async () => {
                        await store.unset(`session-${session.id}`);
                    };
                } else if (name === "sync") {
                    return async () => {
                        session = (await store.get(`session-${session.id}`)) || {};
                    };
                }

                return session[name];
            },
            set: async (_target, name, value) => {
                try {
                    if (session[name] !== value) {
                        session[name] = value;

                        if (store.isConnected()) {
                            console.log("store-before",session)
                            await store.set(`session-${session.id}`, session);
                            console.log("store-after",session)
                        }
                    }
                } catch (error) {
                    console.error("Failed to update session", error);

                    return false;
                }

                return true;
            },
            ownKeys: () => Object.keys(session),
            getOwnPropertyDescriptor: (target, name) => ({
                enumerable: true,
                configurable: true,
                value: session[name]
            })
        });
    }
}

export default Session;
