import { Stroke, Style } from "ol/style";
import { Feature } from "ol";
import { LineString } from "ol/geom";
import { lineString as TurfLineString } from "@turf/helpers";
import booleanPointOnLine from "@turf/boolean-point-on-line";

export default class AngleSnapping {
  #snapGuides;
  #angleSnappingIsActive;
  #allowedTypes;
  #anglesToGenerate;

  #drawModel;
  #map;

  constructor(drawModel, map) {
    this.#drawModel = drawModel;
    this.#map = map;
    this.#snapGuides = [];
    this.#angleSnappingIsActive = false;
    // We can only create perpendicular snapping for these types.
    this.#allowedTypes = ["Polygon", "MultiPolygon", "LineString"];
    // The snapping angles
    // Maybe we should be able to configure these in the future
    this.#anglesToGenerate = [0, 90, 180, 270];
  }

  #handleKeyDownToggle = (e) => {
    this.#angleSnappingIsActive = e.ctrlKey === true || e.metaKey === true;
  };

  setActive = (active) => {
    const fName = active ? "addEventListener" : "removeEventListener";
    window[fName]("keydown", this.#handleKeyDownToggle);
    window[fName]("keyup", this.#handleKeyDownToggle);
    this.#angleSnappingIsActive = false;
  };

  clearSnapGuides = () => {
    this.#snapGuides.forEach((guideFeature) => {
      this.#drawModel.removeFeature(guideFeature);
    });
    this.#snapGuides = [];
  };

  #lookForSegmentInFeature = (feature, coordinate) => {
    let allCoordinates = this.#drawModel.getFeatureCoordinates(feature);

    let i = 0;
    let clickedSegment = null;

    // If a geometry is too complex we might choke the browser....
    // We'll prevent this by limiting this functionality to more simple geometries.
    const maxSegmentsToCheck = 500; // 500 is still allot....

    // Now it's time to look for the specific clicked segment of the feature we clicked.
    // We'll use the segment later to get the relevant angle.
    while (
      !clickedSegment &&
      i < allCoordinates.length - 1 &&
      i <= maxSegmentsToCheck
    ) {
      const segment = [
        allCoordinates[i],
        allCoordinates[i + 1] || allCoordinates[0], // Handle broken MultiPolygons
      ];

      // getClosestPoint did not work as expected so I used methods from turf
      const foundClickedSegment = booleanPointOnLine(
        coordinate,
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
    return clickedSegment;
  };

  #getClickedSegment = (measureFeature, coordinate) => {
    // Unfortunately we need to convert to pixel because there is no "getFeaturesAtCoordinate" at this point
    const px = this.#map.getPixelFromCoordinate(coordinate);
    const clickedFeatures = this.#map
      .getFeaturesAtPixel(px, {
        hitTolerance: 0,
      })
      .filter((f) => {
        // Filter out our draw feature and circles, points etc.
        const type = f.getGeometry().getType();
        return (
          f !== measureFeature &&
          !f.get("USER_MEASUREMENT_GUIDE") === true && // We should not trigger when clicking the green Guides.
          this.#allowedTypes.includes(type)
        );
      });

    if (clickedFeatures.length === 0) {
      // No useful features found
      return;
    }

    let clickedSegment = null;

    for (let i = 0; i < clickedFeatures.length; i++) {
      clickedSegment = this.#lookForSegmentInFeature(
        clickedFeatures[i],
        coordinate
      );
      if (clickedSegment) {
        break;
      }
    }

    return clickedSegment;
  };

  handleDrawStartEvent = (drawStartEvent) => {
    this.clearSnapGuides();
    if (!this.#angleSnappingIsActive) {
      return;
    }

    if (!drawStartEvent.feature) {
      return;
    }

    const measureFeature = drawStartEvent.feature;

    const featureType = measureFeature.getGeometry().getType();

    if (!this.#allowedTypes.includes(featureType)) {
      // Lets escape, this does not feel right
      return;
    }

    // We'll need the clicked coordinate for lookup
    const coord = this.#drawModel.getFeatureCoordinates(measureFeature)[0];

    if (coord) {
      const clickedSegment = this.#getClickedSegment(measureFeature, coord);

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
          color: "rgba(53, 156, 40, 0.2)",
          width: 7,
        });
        const segmentFeature = new Feature({
          geometry: segmentLine,
        });
        segmentFeature.setStyle(
          new Style({
            stroke: segmentStroke,
          })
        );

        this.#drawModel.addFeature(segmentFeature);

        // We'll use this style for all added snapping lines.
        const guideStyle = new Style({
          stroke: new Stroke({
            color: "rgba(0, 255, 0, 0.5)",
            lineDash: null, // Warning! Adding lineDash here makes this sooooooo slow.
            width: 1,
          }),
        });

        let guides = [];

        this.#anglesToGenerate.forEach((angle) => {
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
          feature.set("USER_MEASUREMENT_GUIDE", true);
          this.#drawModel.addFeature(feature);
        });

        // Add the guides etc to ref arr so we can remove them
        // later in clearSnapGuides() (drawEnd)
        guides.push(segmentFeature);
        this.#snapGuides = guides;
      }
    }
  };
}
