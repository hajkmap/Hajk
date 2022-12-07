import React, { useRef } from "react";
import { useState, useCallback } from "react";
import BaseWindowPlugin from "../BaseWindowPlugin";

import Measure2Model from "./Measure2Model";
import Measure2View from "./Measure2View";
import Observer from "react-event-observer";

import { MeasureIcon } from "./MeasureIcons";

import { DEFAULT_MEASUREMENT_SETTINGS } from "./constants";
import DrawModel from "models/DrawModel";
import { Circle, Fill, RegularShape, Stroke, Style } from "ol/style";
import Point from "ol/geom/Point";

function Measure2(props) {
  const [state] = React.useState({});
  const currentHoverFeature = useRef(null);
  const [localObserver] = React.useState(Observer());
  const [drawType, setDrawType] = useState("LineString"); // default to LineString
  const [pluginShown, setPluginShown] = React.useState(
    props.options.visibleAtStart ?? false
  );

  const [model] = React.useState(
    () =>
      new Measure2Model({
        localObserver: localObserver,
        app: props.app,
        map: props.map,
      })
  );

  const [drawModel] = React.useState(
    () =>
      new DrawModel({
        layerName: "pluginMeasure",
        map: props.map,
        observer: localObserver,
        observerPrefix: "measure",
        measurementSettings: DEFAULT_MEASUREMENT_SETTINGS,
        customGetDrawImageStyle: () => {
          return new RegularShape({
            fill: new Fill({
              color: "rgba(255,255,255,1.0)",
            }),
            stroke: new Stroke({
              color: "#000000",
              width: 1,
            }),
            points: 4,
            radius: 10,
            radius2: 0,
            angle: 0,
          });
        },
        drawStyleSettings: {
          fillColor: "rgba(255, 255, 255, 0.3)",
          // we use dashes while drawing and then make the lines solid in handleDrawEnd
          lineDash: [10, 10],
        },
        // TODO: DrawModel only accepts changed to Draw type TEXT (as in Sketch).
        // The labels for measurements are uneffected.
        // textStyleSettings: {
        //   foregroundColor: "#00ffff",
        //   backgroundColor: "#000000",
        //   size: 14,
        // },
      })
  );

  const handleDrawEnd = (e) => {
    if (!e.feature) return;
    const feature = e.feature;
    feature.set("USER_MEASUREMENT", true);
    let style = feature.getStyle();

    if (!style) return;

    if (feature.getGeometry() instanceof Point) {
      style = new Style({
        image: new Circle({
          radius: 6,
          stroke: new Stroke({
            color: "#000000",
            width: 1,
            lineDash: null,
          }),
          fill: new Fill({
            color: "rgba(255,255,255,0.05)",
          }),
        }),
      });
    } else {
      let stroke = style.getStroke();
      // remove the line dash, we only want that while measuring.
      stroke.setLineDash(null);
      style.setStroke(stroke);
    }

    feature.setStyle(style);
  };

  const startInteractionWithDrawType = useCallback(
    (type) => {
      setDrawType(type);
      drawModel.toggleDrawInteraction(type, {
        handleDrawEnd: handleDrawEnd,
        drawStyleSettings: { strokeStyle: { dash: null } },
      });
    },
    [drawModel]
  );

  const handleDrawTypeChange = (e, value) => {
    if (value) {
      // Only update if we get a new value
      // We always want one selection
      startInteractionWithDrawType(value);
    }
  };

  const handlePointerMove = useCallback(
    (e) => {
      if (currentHoverFeature.current) {
        // Restore previous hovered feature style
        let style = currentHoverFeature.current.getStyle();
        let stroke = style.getStroke();
        if (stroke) {
          stroke.setColor("#000000");
          stroke.setWidth(1);
          style.setStroke(stroke);
        }
        let imageStroke = style.getImage()?.getStroke();
        if (imageStroke) {
          // handle Point feature
          imageStroke.setWidth(1);
          imageStroke.setColor("#000000");
          style.getImage().setStroke(imageStroke);
        }
        currentHoverFeature.current.setStyle(style);
        currentHoverFeature.current = null;
      }

      if (drawType !== "Delete") {
        return;
      }

      model.getMap().forEachFeatureAtPixel(e.pixel, function (f) {
        if (
          f.get("USER_DRAWN") === true &&
          f.get("USER_MEASUREMENT") === true
        ) {
          // Make feature stroke-color red to better visualize what will be deleted.
          let style = f.getStyle();
          let stroke = style.getStroke();
          if (stroke) {
            stroke.setColor("#ff0000");
            stroke.setWidth(2);
            style.setStroke(stroke);
          }

          let imageStroke = style.getImage()?.getStroke();
          if (imageStroke) {
            // handle Point feature
            imageStroke.setWidth(2);
            imageStroke.setColor("#ff0000");
            style.getImage().setStroke(imageStroke);
          }

          f.setStyle(style);
          currentHoverFeature.current = f;
          return true;
        }
      });
    },
    [drawType, currentHoverFeature, model]
  );

  React.useEffect(() => {
    model.getMap().on("pointermove", handlePointerMove);
    return () => {
      model.getMap().un("pointermove", handlePointerMove);
    };
  }, [model, handlePointerMove]);

  React.useEffect(() => {
    if (!pluginShown) {
      drawModel.toggleDrawInteraction("");
      return;
    }
    startInteractionWithDrawType(drawType);
  }, [pluginShown, drawType, drawModel, startInteractionWithDrawType]);

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
