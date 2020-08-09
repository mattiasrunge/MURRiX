
/* global FileReader */

import useAsync from "./useAsync";

const useFileImageUrl = (file) => useAsync(() => new Promise((resolve) => {
    const reader = new FileReader();

    reader.addEventListener("load", (e) => resolve(e.target.result));
    reader.readAsDataURL(file);
}));

export default useFileImageUrl;
