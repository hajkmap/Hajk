import React from "react";
import { useState, useCallback } from "react";
import BaseWindowPlugin from "../BaseWindowPlugin";

import Measure2Model from "./Measure2Model";
import Measure2View from "./Measure2View";
import Observer from "react-event-observer";

import { MeasureIcon } from "./MeasureIcons";

import { DEFAULT_MEASUREMENT_SETTINGS } from "./constants";
import DrawModel from "models/DrawModel";

function Measure2(props) {
  const [state] = React.useState({});

  const [localObserver] = React.useState(Observer());
  const [pluginShown, setPluginShown] = React.useState(
    props.options.visibleAtStart ?? false
  );

  const [useFreehand, setUseFreehand] = React.useState(false);

  const [drawType, setDrawType] = useState("LineString"); // default to LineString

  const handleDrawEnd = (e) => {
    let style = e.feature.getStyle();
    if (style) {
      let stroke = style.getStroke();
      // remove the line dash, we only want that while measuring.
      stroke.setLineDash(null);
      style.setStroke(stroke);
      e.feature.setStyle(style);
    }
  };

  const [drawModel] = React.useState(
    () =>
      new DrawModel({
        layerName: "pluginMeasure",
        map: props.map,
        observer: localObserver,
        observerPrefix: "measure",
        measurementSettings: DEFAULT_MEASUREMENT_SETTINGS,

        drawStyleSettings: {
          fillColor: "rgba(255, 255, 255, 0.3)",
          // we use dashes while drawing and then make the lines solid in handleDrawEnd
          lineDash: [10, 10],
        },
      })
  );

  const startInteractionWithDrawType = useCallback(
    (type) => {
      drawModel.toggleDrawInteraction(type, {
        handleDrawEnd: handleDrawEnd,
        freehand: useFreehand,
        drawStyleSettings: { strokeStyle: { dash: null } },
      });
      setDrawType(type);
    },
    [drawModel, useFreehand]
  );

  const handleDrawTypeChange = (e, value) => {
    if (value) {
      // Only update if we get a new value
      // We always want one selection
      startInteractionWithDrawType(value);
    }
  };

  const [model] = React.useState(
    () =>
      new Measure2Model({
        localObserver: localObserver,
        app: props.app,
        map: props.map,
      })
  );

  const handleKeyDown = (e) => {
    setUseFreehand(e.shiftKey === true);
  };

  React.useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyDown);
    };
  }, []);

  React.useEffect(() => {
    if (!pluginShown) {
      return drawModel.toggleDrawInteraction("");
    }
    return startInteractionWithDrawType(drawType);
  }, [drawModel, drawType, pluginShown, startInteractionWithDrawType]);

  const onWindowHide = () => {
    setPluginShown(false);
  };

  const onWindowShow = () => {
    setPluginShown(true);
  };

  return (
    <BaseWindowPlugin
      {...props}
      type="Measure2"
      custom={{
        icon: <MeasureIcon />,
        title: state.title || "Measure",
        description: "En kort beskrivning som visas i widgeten",
        height: "dynamic",
        width: 400,
        onWindowHide: onWindowHide,
        onWindowShow: onWindowShow,
      }}
    >
      <Measure2View
        model={model}
        app={props.app}
        localObserver={localObserver}
        globalObserver={props.app.globalObserver}
        drawType={drawType}
        handleDrawTypeChange={handleDrawTypeChange}
      />
    </BaseWindowPlugin>
  );
}

export default Measure2;
