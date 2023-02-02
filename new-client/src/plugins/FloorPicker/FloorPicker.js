import React from "react";
import Observer from "react-event-observer";
import VerticalAlignCenterIcon from "@mui/icons-material/VerticalAlignCenter";

// Views
import BaseWindowPlugin from "../BaseWindowPlugin";
import FloorPickerView from "./FloorPickerView";

// Models
import FloorPickerModel from "./FloorPickerModel";

// Hooks
const FloorPicker = (props) => {
  const [localObserver] = React.useState(() => Observer());
  const [model] = React.useState(() => new FloorPickerModel(props));
  const [active, setActive] = React.useState(
    (props.app.activeTool = "floorpicker")
  );

  const onWindowHide = () => {
    model.reset();
    setActive(false);
  };

  const onWindowShow = () => {
    setActive(true);
  };

  return (
    <BaseWindowPlugin
      {...props}
      type="FloorPicker"
      custom={{
        icon: <VerticalAlignCenterIcon />,
        title: "Välj Plan",
        description: "Filtrera vid plan",
        height: "dynamic",
        width: 250,
        onWindowHide: onWindowHide,
        onWindowShow: onWindowShow,
      }}
    >
      <FloorPickerView
        toolActive={active}
        model={model}
        options={props.options}
        localObserver={localObserver}
        globalObserver={props.app.globalObserver}
      />
    </BaseWindowPlugin>
  );
};

export default FloorPicker;
