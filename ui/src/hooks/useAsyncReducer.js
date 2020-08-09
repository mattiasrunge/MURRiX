
import React from "react";

// Credits: https://usehooks.com/
const useAsync = (asyncFunction, reducer, initialValue) => {
    const [ loading, setLoading ] = React.useState(false);
    const [ error, setError ] = React.useState(null);
    const [ value, dispatch ] = React.useReducer(reducer, initialValue);

    const execute = React.useCallback(() => {
        setLoading(true);
        setError(null);

        return asyncFunction()
        .then((value) => dispatch({ type: "set", value }))
        .catch(setError)
        .finally(() => setLoading(false));
    }, [ asyncFunction ]);

    React.useEffect(() => {
        execute();
    }, [ execute ]);

    return { execute, loading, value, error, dispatch };
};

export default useAsync;
