
import React from "react";
import Knockout from "components/knockout";

class Widget extends Knockout {
    getTemplate() {
        console.log("Widget getTemplate");

        return (
            <div>
                Hej <span data-bind="text: name"></span>
            </div>
        );
    }
}

export default Widget;
