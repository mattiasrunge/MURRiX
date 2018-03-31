
/* global document */

class UI {
    setTitle(title) {
        document.title = title ? title : "MURRiX";
    }
}

export default new UI();
