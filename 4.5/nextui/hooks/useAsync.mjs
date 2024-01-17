
import React from "react";

// Credits: https://usehooks.com/
const useAsync = (asyncFunction, initialValue = null) => {
    const [ loading, setLoading ] = React.useState(false);
    const [ error, setError ] = React.useState(null);
    const [ value, setValue ] = React.useState(initialValue);

    const execute = React.useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const value = await asyncFunction();
            setValue(value);
        } catch (error) {
            setError(error);
        } finally {
            setLoading(false);
        }
    }, [ asyncFunction ]);

    React.useEffect(() => {
        execute();
    }, [ execute ]);

    return { execute, loading, value, error };
};

export default useAsync;
