import React, { useRef } from "react";
import { useState, useCallback } from "react";
import BaseWindowPlugin from "../BaseWindowPlugin";

import MeasurerView from "./MeasurerView";
import Observer from "react-event-observer";

import { MeasurerIcon } from "./MeasurerIcons";

import { DEFAULT_MEASUREMENT_SETTINGS } from "./constants";
import DrawModel from "models/DrawModel";
import { Circle, Fill, RegularShape, Stroke, Style } from "ol/style";
import HelpIcon from "@mui/icons-material/Help";
import { Feature } from "ol";
import { LineString } from "ol/geom";
import { lineString as TurfLineString } from "@turf/helpers";
import booleanPointOnLine from "@turf/boolean-point-on-line";

function Measurer(props) {
  const { map, app } = props;
  const [state] = React.useState({});
  const currentHoverFeature = useRef(null);
  const [localObserver] = React.useState(Observer());
  const [drawType, setDrawType] = useState("LineString"); // default to LineString as previous Measure tool
  const [pluginShown, setPluginShown] = React.useState(
    props.options.visibleAtStart ?? false
  );
  const snapGuides = React.useRef([]);

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

  const clearSnapGuides = useCallback(() => {
    snapGuides.current.forEach((guideFeature) => {
      drawModel.removeFeature(guideFeature);
    });
    snapGuides.current = [];
  }, [drawModel]);

  const handleDrawStart = useCallback(
    (e) => {
      if (!e.feature) {
        return;
      }

      const measureFeature = e.feature;

      // The snapping angles
      // Maybe we should be able to configure these in the future
      const anglesToGenerate = [0, 90, 180, 270];

      // We can only create perpendicular snapping for these types.
      const allowedTypes = ["Polygon", "LineString"];
      const featureType = measureFeature.getGeometry().getType();

      if (!allowedTypes.includes(featureType)) {
        // Lets escape
        return;
      }

      // We'll need the clicked coordinate for lookup
      const coord = drawModel.getFeatureCoordinates(measureFeature)[0];

      if (coord) {
        // Unfortunately we need to convert to pixel because there is no "getFeaturesAtCoordinate" at this point
        const px = map.getPixelFromCoordinate(coord);
        const clickedFeatures = map
          .getFeaturesAtPixel(px, {
            hitTolerance: 0,
          })
          .filter((f) => {
            // Filter out our draw feature and circles, points etc.
            const type = f.getGeometry().getType();
            return f !== measureFeature && allowedTypes.includes(type);
          });

        if (clickedFeatures.length === 0) {
          // No useful features found
          return;
        }

        // Lets use the first available feature and get all its coordinates
        let allCoordinates = drawModel.getFeatureCoordinates(
          clickedFeatures[0]
        );

        let i = 0;
        let clickedSegment = null;

        // If a geometry is too complex we might choke the browser....
        // We'll prevent this by limiting this functionality to more simple geometries.
        const maxSegmentsToCheck = 500; // 500 is still allot....

        while (
          !clickedSegment &&
          i < allCoordinates.length &&
          i <= maxSegmentsToCheck
        ) {
          const segment = [allCoordinates[i], allCoordinates[i + 1]];

          // getClosestPoint did not work as expected so I used methods from turf
          let foundClickedSegment = booleanPointOnLine(
            coord,
            new TurfLineString(segment),
            {
              ignoreEndVertices: false,
              epsilon: 0.001, // I got no matches without a value here (hitTolerance/fuzziness)
            }
          );

          if (foundClickedSegment) {
            clickedSegment = segment;
          }

          i++;
        }

        if (clickedSegment) {
          const segmentLine = new LineString(clickedSegment);

          // Get the angle of the clicked segment
          const angleRadians = Math.atan2(
            clickedSegment[0][0] - clickedSegment[1][0],
            clickedSegment[0][1] - clickedSegment[1][1]
          );

          // Lets add a nice line on top of the segment
          // to highlight the "owner" segment. Kind of like a selection.
          const segmentStroke = new Stroke({
            color: "rgba(0, 255, 0, 0.2)",
            width: 5,
          });
          const segmentFeature = new Feature({
            geometry: segmentLine,
          });
          segmentFeature.setStyle(
            new Style({
              stroke: segmentStroke,
            })
          );

          drawModel.addFeature(segmentFeature);

          // We'll use this style for all added snapping lines.
          const guideStyle = new Style({
            stroke: new Stroke({
              color: "rgba(0, 255, 0, 0.5)",
              lineDash: null, // Warning! Adding lineDash here makes this sooooooo slow.
              width: 1,
            }),
          });

          let guides = [];

          anglesToGenerate.forEach((angle) => {
            angle = (angle * Math.PI) / 180; // Degrees to radians
            let targetX = coord[0] + 100000 * Math.cos(angle);
            let targetY = coord[1] + 100000 * Math.sin(angle);
            let guideLine = new LineString([
              [coord[0], coord[1]],
              [targetX, targetY],
            ]);
            guideLine.rotate(-angleRadians, coord);
            let feature = new Feature({
              geometry: guideLine,
            });
            feature.setStyle(guideStyle);

            guides.push(feature);
            drawModel.addFeature(feature);
          });

          // Add the guides etc to ref arr so we can remove them
          // later in clearSnapGuides() (drawEnd)
          guides.push(segmentFeature);
          snapGuides.current = guides;
        }
      }
    },
    [map, drawModel, snapGuides]
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
      clearSnapGuides();
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
    [clearSnapGuides]
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

  // const mapClick = useCallback((e) => {
  //   console.log("click");
  // }, []);

  // React.useEffect(() => {
  //   console.log("hej", map);
  //   // map.on("singleclick", mapClick);
  //   // return () => {
  //   //   map.un("singleclick", mapClick);
  //   // };
  // }, [map, mapClick]);

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
        description: "",
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
