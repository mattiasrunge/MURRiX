
/* global document */

import mousetrap from "mousetrap";

class UI {
    constructor() {
        this.shortcuts = {};
        this.interceptors = [];

        const stopCallback = mousetrap?.prototype?.stopCallback;

        stopCallback && (mousetrap.prototype.stopCallback = (e, element, combo) => {
            for (const interceptor of this.interceptors) {
                if (interceptor(e, element, combo)) {
                    return true;
                }
            }

            return stopCallback.bind(mousetrap)(e, element, combo);
        });
    }

    setTitle(title) {
        document.title = title ? title : "MURRiX";
    }

    shortcut(keys, fn, interceptor) {
        if (this.shortcuts[keys]) {
            this.shortcuts[keys].push(fn);
        } else {
            this.shortcuts[keys] = [ fn ];

            mousetrap.bind(keys, (e) => {
                for (const fn of this.shortcuts[keys]) {
                    fn(e);
                }
            });
        }

        if (interceptor) {
            this.interceptors.push(interceptor);
        }

        return {
            dispose: () => {
                this.shortcuts[keys] = this.shortcuts[keys].filter((f) => f !== fn);

                if (this.shortcuts[keys].length === 0) {
                    mousetrap.unbind(keys);

                    delete this.shortcuts[keys];
                }

                if (interceptor) {
                    this.interceptors = this.interceptors.filter((i) => i !== interceptor);
                }
            }
        };
    }
}

export default new UI();
