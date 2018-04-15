
/* global document */

import mousetrap from "mousetrap";

class UI {
    constructor() {
        this.shortcuts = {};
    }

    setTitle(title) {
        document.title = title ? title : "MURRiX";
    }

    shortcut(keys, fn) {
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

        return {
            dispose: () => {
                this.shortcuts[keys] = this.shortcuts[keys].filter((f) => f !== fn);

                if (this.shortcuts[keys].length === 0) {
                    mousetrap.unbind(keys);

                    delete this.shortcuts[keys];
                }
            }
        };
    }
}

export default new UI();
