"use strict";

import Deferred from "./deferred";

class Emitter {
    constructor() {
        this.subscriptions = [];
    }

    on(event, fn) {
        const subscription = {
            event,
            fn,
            dispose: () => {
                const index = this.subscriptions.indexOf(subscription);

                (index !== -1) && this.subscriptions.splice(index, 1);
            }
        };

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
