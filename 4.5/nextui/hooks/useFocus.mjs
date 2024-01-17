
import React from "react";

const useFocus = () => {
    const ref = React.useRef(null);
    const setFocus = React.useCallback(() => ref.current && ref.current.focus(), [ ref ]);
    React.useEffect(() => setFocus(), [ setFocus ]);

    return [ ref, setFocus ];
};

export default useFocus;
