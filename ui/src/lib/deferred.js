
class Deferred {
    constructor() {
        this.settled = false;
        this.resolved = false;
        this.rejected = false;

        this.promise = new Promise((resolve, reject) => {
            this.resolve = () => {
                this.settled = true;
                this.resolved = true;

                return resolve();
            };

            this.reject = () => {
                this.settled = true;
                this.rejected = true;

                return reject();
            };
        });
    }
}

export default Deferred;
