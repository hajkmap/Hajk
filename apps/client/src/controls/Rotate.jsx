import { useEffect, useRef, useState } from "react";
import { easeOut } from "ol/easing";
import NavigationIcon from "@mui/icons-material/Navigation";
import ControlButton from "components/ControlButton";

const RotateControl = (props) => {
  const view = useRef();
  const [rotation, setRotation] = useState(view.current?.getRotation() || 0);

  useEffect(() => {
    // No reason to go on if there's no map yet
    if (!props.map) return;

    // Put the View object into our ref
    view.current = props.map.getView();

    // Subscribe to View's rotation change event. When this happens,
    // we want to read the new rotation and put in state.
    view.current.on("change:rotation", subscribeToRotation);
    return () => {
      // Callback in useEffect is the place where we can cleanup
      // previous code. In this case, we unsubscribe the from the
      // event (so we don't get multiple listeners should this get
      // called more times).
      view.current.un("change:rotation", subscribeToRotation);
    };
  }, [props]);

  // Use when (un)subscribing View's change rotation event
  function subscribeToRotation() {
    setRotation(view.current.getRotation());
  }

  // onClick handler that resets the map (north at top)
  function rotateNorth() {
    const duration = 1000;

    if (!view.current) return;

    view.current.animate({
      rotation: 0,
      duration: duration,
      easing: easeOut,
    });
  }

  return (
    (props.map && rotation !== 0 && (
      <ControlButton
        tooltip="Återställ rotation"
        ariaLabel="Återställ rotation"
        onClick={rotateNorth}
      >
        <NavigationIcon style={{ transform: `rotate(${rotation}rad)` }} />
      </ControlButton>
    )) ||
    null
  );
};

export default RotateControl;
