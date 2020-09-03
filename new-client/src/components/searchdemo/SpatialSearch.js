import React, { useEffect, useRef, useState } from "react";
import { Vector as VectorLayer } from "ol/layer";
import VectorSource from "ol/source/Vector";
import { Stroke, Style, Circle, Fill } from "ol/style";
import ToggleButton from "@material-ui/lab/ToggleButton";
import CheckIcon from "@material-ui/icons/BrushTwoTone";
import Draw from "ol/interaction/Draw";
import { Button } from "@material-ui/core";

const SpatialSearch = (props) => {
  const [drawActive, setDrawActive] = useState(false);
  const drawInteraction = useRef();
  const drawSource = useRef();
  const drawLayer = useRef();
  const map = useRef(props.map);
  const searchModel = props.app.appModel.searchModel;

  const drawStyle = useRef(
    new Style({
      stroke: new Stroke({
        color: "rgba(255, 214, 91, 0.6)",
        width: 4,
      }),
      fill: new Fill({
        color: "rgba(255, 214, 91, 0.2)",
      }),
      image: new Circle({
        radius: 6,
        stroke: new Stroke({
          color: "rgba(255, 214, 91, 0.6)",
          width: 2,
        }),
      }),
    })
  );

  useEffect(() => {
    console.log("Adding Draw Layer");
    drawSource.current = new VectorSource({ wrapX: false });
    drawLayer.current = new VectorLayer({
      source: drawSource.current,
      style: drawStyle.current,
    });

    // Add layer that will be used to allow user draw on map - used for spatial search
    map.current.addLayer(drawLayer.current);
  }, []);

  const toggleDraw = (
    active,
    type = "Polygon",
    freehand = false,
    drawEndCallback
  ) => {
    console.log("active: ", active);
    if (active) {
      drawInteraction.current = new Draw({
        source: drawSource.current,
        type: type,
        freehand: freehand,
        stopClick: true,
        style: drawStyle.current,
      });

      map.current.clicklock = true;
      map.current.addInteraction(drawInteraction.current);
    } else {
      map.current.removeInteraction(drawInteraction.current);
      map.current.clicklock = false;
      drawSource.current.clear();
    }
  };

  const handleClickOnDrawToggle = () => {
    setDrawActive((prevState) => {
      toggleDraw(!prevState);
      return !prevState;
    });
  };

  const handleClickOnFireSpatialSearch = async () => {
    const searchOptions = searchModel.getSearchOptions();
    console.log("originalSearchOptions: ", searchOptions.featuresToFilter);
    searchOptions["featuresToFilter"] = drawSource.current.getFeatures();
    console.log("originalSearchOptions: ", searchOptions.featuresToFilter);
    const searchString = document.getElementById("searchInputField").value;
    console.log("searchString: ", searchString);
    const results = await searchModel.getResults(
      searchString,
      undefined,
      searchOptions
    );
    console.log("results: ", results);
  };

  return (
    <>
      <ToggleButton
        value="check"
        selected={drawActive}
        onChange={handleClickOnDrawToggle}
      >
        <CheckIcon />
      </ToggleButton>
      <Button onClick={handleClickOnFireSpatialSearch}>Search</Button>
    </>
  );
};

export default SpatialSearch;
