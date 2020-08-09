
let idCounter = 1;

class Job {
    constructor(color, name, onUpdate) {
        this.id = idCounter++;
        this.color = color;
        this.name = name;
        this.text = `${name} job initializing...`;
        this.progress = 0;
        this.onUpdate = onUpdate;
    }

    _update() {
        this.onUpdate(this);
    }

    update(attributes) {
        for (const [ key, value ] of Object.entries(attributes)) {
            this[key] = value;
        }

        this._update();
    }

}

export default Job;
