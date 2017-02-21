"use strict";

const ko = require("knockout");

module.exports.register = (ownerDocument, name, fn) => {
    ko.components.register(name, {
        viewModel: {
            createViewModel: (params, componentInfo) => {
                const Model = function() {
                    fn(this, params, componentInfo.element)
                    .then((dispose) => {
                        if (typeof dispose === "function") {
                            this.dispose = dispose;
                        }
                    })
                    .catch((error) => {
                        console.error(error.stack);
                    });
                };

                return new Model;
            }
        },
        template: {
            element: ownerDocument.querySelector("#template-" + name)
        }
    });
};
