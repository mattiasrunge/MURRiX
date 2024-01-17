
import React from "react";
import usePrevious from "./usePrevious";

const useOnChange = (value, fn) => {
    const previous = usePrevious(value);

    React.useEffect(() => {
        if (value !== previous) {
            fn(previous, value);
        }
    }, [ value, previous, fn ]);
};

export default useOnChange;
