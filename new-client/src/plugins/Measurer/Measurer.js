import React, { useRef, useMemo } from "react";
import { useState, useCallback } from "react";
import BaseWindowPlugin from "../BaseWindowPlugin";

import MeasurerView from "./MeasurerView";
import Observer from "react-event-observer";

import { MeasurerIcon } from "./MeasurerIcons";

import { DEFAULT_MEASUREMENT_SETTINGS } from "./constants";
import DrawModel from "models/DrawModel";
import { Circle, Fill, RegularShape, Stroke, Style } from "ol/style";
import HelpIcon from "@mui/icons-material/Help";
import AngleSnapping from "./AngleSnapping";

function Measurer(props) {
  const { map, app } = props;
  const [state] = React.useState({});
  const currentHoverFeature = useRef(null);
  const [localObserver] = React.useState(Observer());
  const [drawType, setDrawType] = useState("LineString"); // default to LineString as previous Measure tool
  const [pluginShown, setPluginShown] = React.useState(
    props.options.visibleAtStart ?? false
  );
  const angleSnapping = useMemo(() => {
    return new AngleSnapping();
  }, []);

  const [drawModel] = React.useState(
    () =>
      new DrawModel({
        layerName: "pluginMeasure",
        layerCaption: "Measure layer",
        map: map,
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
      })
  );

  const handleDrawStart = useCallback(
    (e) => {
      // Forward drawstart event etc. to angle snapper.
      angleSnapping.handleDrawStartEvent(e, map, drawModel);
    },
    [angleSnapping, map, drawModel]
  );

  const handleAddFeature = useCallback(
    (e) => {
      // This is used to clean up measurements that results in 0 (zero).
      // We should not allow measurements with zero.
      // The old Measure tool does not address this issue.

      if (!e.feature) {
        return;
      }
      const feature = e.feature;
      const geom = feature.getGeometry();
      const type = geom.getType();

      let remove = false;

      if (type === "LineString") {
        remove = geom.getLength() === 0;
      } else if (type === "Polygon") {
        remove = geom.getArea() === 0;
      }

      if (remove) {
        drawModel.removeFeature(feature);
      }
    },
    [drawModel]
  );

  const handleDrawEnd = useCallback(
    (e) => {
      angleSnapping.clearSnapGuides(drawModel);
      if (!e.feature) return;
      const feature = e.feature;
      const type = feature.getGeometry().getType();

      feature.set("USER_MEASUREMENT", true);
      let style = feature.getStyle();

      if (!style) return;

      if (type === "Point") {
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
    },
    [angleSnapping, drawModel]
  );

  const startInteractionWithDrawType = useCallback(
    (type) => {
      setDrawType(type);
      drawModel.toggleDrawInteraction(type, {
        handleDrawEnd: handleDrawEnd,
        handleDrawStart: handleDrawStart,
        handleAddFeature: handleAddFeature,
        drawStyleSettings: { strokeStyle: { dash: null } },
      });
    },
    [drawModel, handleAddFeature, handleDrawEnd, handleDrawStart]
  );

  const handleDrawTypeChange = (e, value) => {
    if (value) {
      // Only update if we get a new value
      // We always want one selection
      startInteractionWithDrawType(value);
    }
  };

  const restoreHoveredFeature = () => {
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
  };

  // Handle hover effect for DrawType Delete.
  // We'll set the currently hovered features line to red to make selection visible.
  // Otherwise you would need to guess what will be deleted.
  const handlePointerMove = useCallback(
    (e) => {
      if (!pluginShown) {
        return;
      }

      restoreHoveredFeature();

      if (drawType !== "Delete") {
        return;
      }

      map.forEachFeatureAtPixel(e.pixel, function (f) {
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
    [drawType, currentHoverFeature, pluginShown, map]
  );

  React.useEffect(() => {
    map.on("pointermove", handlePointerMove);

    return () => {
      map.un("pointermove", handlePointerMove);
    };
  }, [map, handlePointerMove, drawModel]);

  React.useEffect(() => {
    if (!pluginShown) {
      drawModel.toggleDrawInteraction("");
      return;
    }

    startInteractionWithDrawType(drawType);
  }, [pluginShown, drawType, drawModel, startInteractionWithDrawType]);

  const onWindowHide = () => {
    restoreHoveredFeature();
    setPluginShown(false);
  };

  const onWindowShow = () => {
    setPluginShown(true);
  };

  const customHeaderButtons = [
    {
      icon: <HelpIcon />,
      description: "Hjälp",
      onClickCallback: () => {
        localObserver.publish("show-help");
      },
    },
  ];

  //
  return (
    <BaseWindowPlugin
      {...props}
      type="Measurer"
      custom={{
        icon: <MeasurerIcon />,
        title: state.title || "Mät",
        description: "Mät längder och ytor",
        height: "dynamic",
        width: 360,
        customPanelHeaderButtons: customHeaderButtons,

        onWindowHide: onWindowHide,
        onWindowShow: onWindowShow,
      }}
    >
      <MeasurerView
        app={app}
        localObserver={localObserver}
        drawType={drawType}
        drawModel={drawModel}
        handleDrawTypeChange={handleDrawTypeChange}
      />
    </BaseWindowPlugin>
  );
}

export default Measurer;
