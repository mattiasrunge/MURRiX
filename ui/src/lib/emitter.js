
import Deferred from "./deferred";

let counter = 0;

class Emitter {
    constructor() {
        this.subscriptions = [];
    }

    on(event, fn, options = {}) {
        const subscription = {
            id: options.id || `${Date.now()}_${counter++}`,
            event,
            fn,
            dispose: () => {
                const index = this.subscriptions.indexOf(subscription);

                (index !== -1) && this.subscriptions.splice(index, 1);
            }
        };

        this.subscriptions = this.subscriptions.filter((s) => s.id !== subscription.id);

        this.subscriptions.push(subscription);

        return subscription;
    }

    async emit(event, ...args) {
        const subscriptions = this.subscriptions.filter((s) => s.event === event);

        for (const subscription of subscriptions) {
            await Promise.resolve(subscription.fn(event, ...args));
        }
    }

    waitFor(event, timeout = false) {
        const deferred = new Deferred();
        const subscription = this.on(event, async (...args) => {
            subscription.timer && clearTimeout(subscription.timer);
            subscription.dispose();
            deferred.resolve(...args);
        });

        if (timeout) {
            subscription.timer = setTimeout(() => {
                subscription.dispose();
                deferred.reject(new Error("Timeout"));
            }, timeout);
        }

        return deferred.promise;
    }

    dispose() {
        this.subscriptions.length = 0;
    }
}

export default Emitter;
