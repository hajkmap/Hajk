import React, { useEffect, useState } from "react";

import { boundingExtent } from "ol/extent";
import { Stroke, Style, Circle, Fill } from "ol/style";

import SearchResultGroup from "./SearchResultGroup";

import { makeStyles } from "@material-ui/core/styles";
import { Paper } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
    backgroundColor: theme.palette.background.paper,
    position: "relative",
    overflow: "auto",
    maxHeight: 300,
  },
  heading: {
    fontSize: theme.typography.pxToRem(15),
    fontWeight: theme.typography.fontWeightRegular,
  },
}));

const highlightedStyle = new Style({
  stroke: new Stroke({
    color: [200, 0, 0, 0.7],
    width: 4,
  }),
  fill: new Fill({
    color: [255, 0, 0, 0.1],
  }),
  image: new Circle({
    radius: 6,
    stroke: new Stroke({
      color: [200, 0, 0, 0.7],
      width: 4,
    }),
  }),
});

function SearchResultList({
  map,
  searchResults: { featureCollections, errors },
  resultsSource,
}) {
  const classes = useStyles();

  const [checkedItems, setCheckedItems] = useState([]);

  useEffect(() => {
    map.current.on("click", function (evt) {
      map.current.forEachFeatureAtPixel(evt.pixel, (feature) => {
        const featureId = feature.getId();
        handleClickedItem(featureId);
      });
    });
  });

  const handleClickedItem = (value) => {
    const currentIndex = checkedItems.indexOf(value);
    const newChecked = [...checkedItems];

    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setCheckedItems(newChecked); // Set state so our checkboxes are up-to-date
    changeStyleOnCheckedItems(newChecked); // Set another OpenLayers Style so we can distinguish checked items
    zoomToCheckedItems(newChecked); // Ensure we zoom out so all checked features fit
  };

  const handleCheckedToggle = (value) => () => {
    const currentIndex = checkedItems.indexOf(value);
    const newChecked = [...checkedItems];

    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setCheckedItems(newChecked); // Set state so our checkboxes are up-to-date
    changeStyleOnCheckedItems(newChecked); // Set another OpenLayers Style so we can distinguish checked items
    zoomToCheckedItems(newChecked); // Ensure we zoom out so all checked features fit
  };

  const changeStyleOnCheckedItems = (items = checkedItems) => {
    // First unset style on ALL features (user might have UNCHECKED a feature)
    resultsSource.current.getFeatures().map((f) => f.setStyle(null));

    // Now, set the style only on currently selected features
    items.map((fid) =>
      resultsSource.current.getFeatureById(fid).setStyle(highlightedStyle)
    );
  };

  const zoomToCheckedItems = (items = checkedItems) => {
    // Try to grab extents for each of the selected items
    const extentsFromCheckedItems = items.map((fid) =>
      resultsSource.current.getFeatureById(fid).getGeometry().getExtent()
    );

    // If there were no selected items, use extent for the OL source itself,
    // else create a boundary that will fit all selected items
    const extentToZoomTo =
      extentsFromCheckedItems.length < 1
        ? resultsSource.current.getExtent()
        : boundingExtent(extentsFromCheckedItems);

    map.current.getView().fit(extentToZoomTo, {
      size: map.current.getSize(),
      maxZoom: 7,
    });
  };

  return (
    <Paper id="searchResultList" className={classes.root}>
      {featureCollections.map((fc) => (
        <SearchResultGroup
          id="searchResultGroup"
          key={fc.source.id}
          map={map}
          featureCollection={fc}
          resultsSource={resultsSource}
          checkedItems={checkedItems}
          handleCheckedToggle={handleCheckedToggle}
        />
      ))}
    </Paper>
  );
}

export default SearchResultList;
