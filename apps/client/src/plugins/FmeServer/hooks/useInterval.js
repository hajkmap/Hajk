import { useEffect, useRef } from "react";

// This hook is a wrapper around the setInterval and clearInterval api.
// It makes sure to remove the interval(s) if the component unmounts.
// Using this hook is really easy. The example below will run the pollData-function
// every 15 seconds:
// useInterval(() => { pollData() }, 15 * 1000);
// To remove the interval, simply pass null to the hook instead, as follows:
// useInterval(() => { pollData() }, null);
export default function useInterval(callback, delay) {
  const savedCallback = useRef();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}
