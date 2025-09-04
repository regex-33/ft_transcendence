const History = (() => {
    let history = [];
    return {
        add: (state) => {
            history.push(state);
        },
        get: () => {
            return history;
        },
        clear: () => {
            history = [];
        }
    };
})();
 