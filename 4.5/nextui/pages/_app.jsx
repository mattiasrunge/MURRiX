
import dynamic from "next/dynamic";

export default dynamic(() => import("./_root"), {
    ssr: false
});
