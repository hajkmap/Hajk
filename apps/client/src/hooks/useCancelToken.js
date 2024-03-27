import React from "react";

export default function useCancelToken() {
  const token = React.useRef({ cancelled: false });
  const cancel = () => {
    token.current.cancelled = true;
  };
  const reset = () => {
    token.current.cancelled = false;
  };
  return [token.current, cancel, reset];
}
