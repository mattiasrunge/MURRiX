
/* global document */

import mousetrap from "mousetrap";

class UI {
    constructor() {
        this.shortcuts = {};
        this.interceptors = [];

        const stopCallback = mousetrap.prototype.stopCallback;
        const self = this;

        mousetrap.prototype.stopCallback = function(e, element, combo) {
            for (const interceptor of self.interceptors) {
                if (interceptor(e, element, combo)) {
                    return true;
                }
            }

            return stopCallback.bind(this)(e, element, combo);
        };
    }

    setTitle(title) {
        document.title = title ? title : "MURRiX";
    }

    shortcut(keys, fn, interceptor) {
        if (this.shortcuts[keys]) {
            this.shortcuts[keys].push(fn);
        } else {
            this.shortcuts[keys] = [ fn ];

            mousetrap.bind(keys, () => {
                for (const fn of this.shortcuts[keys]) {
                    fn();
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
