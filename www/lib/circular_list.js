"use strict";

class CircularList {
    constructor(list, current) {
        this.list = list;
        this.currentIndex = -1;

        if (typeof current !== "undefined") {
            if (typeof current === "number") {
                this.currentIndex = current;
            } else {
                this.currentIndex = this.list.indexOf(current);
            }
        }
    }

    get index() {
        return this.currentIndex;
    }

    get current() {
        // console.log("cu", this.list, this.currentIndex)
        if (this.currentIndex === -1) {
            return;
        }

        return this.list[this.currentIndex];
    }

    offset(offset) {
        if (this.list.length === 0) {
            return;
        }

        let index = this.currentIndex + offset;

        if (index >= this.list.length) {
            index = 0;
        } else if (index < 0) {
            index = this.list.length - 1;
        }

        return new CircularList(this.list, index);
    }

    select(item) {
        if (typeof item === "function") {
            return new CircularList(this.list, this.list.findIndex(item));
        }

        return new CircularList(this.list, item);
    }

    next() {
        return this.offset(+1);
    }

    previous() {
        return this.offset(-1);
    }
}

export default CircularList;
