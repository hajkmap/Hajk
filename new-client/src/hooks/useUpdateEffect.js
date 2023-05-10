import React from "react";
// A simple usEffect-hook that does not run on the first render
export default function useUpdateEffect(func, deps = []) {
  const didMount = React.useRef(false);
  React.useEffect(() => {
    if (didMount.current) {
      return func();
    } else {
      didMount.current = true;
    }
    // The linter does not like when we have fun with custom effects :(
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
