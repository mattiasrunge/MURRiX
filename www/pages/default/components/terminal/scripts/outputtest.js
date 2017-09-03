
export default {
    desc: "Test output",
    exec: async (term) => {
        for (let n = 1; n < 10; n++) {
            await new Promise((resolve) => {
                setTimeout(() => {
                    term.log(n);
                    resolve();
                }, 1000);
            });
        }

        return "Done";
    }
};
