import React, { useState } from "react";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import ImageIcon from "@mui/icons-material/MapTwoTone";
import { ListSubheader } from "@mui/material";

import { useMapClickViewerContext } from "../MapClickViewerContext";

import Breadcrumbs from "./Breadcrumbs";
import FeatureDetailView from "./FeatureDetailView";

const FeaturesListView = (props) => {
  const {
    featureCollection,
    selectedFeatureCollection,
    setSelectedFeatureCollection,
  } = props;

  const { appModel } = useMapClickViewerContext();

  const [selectedFeature, setSelectedFeature] = useState(null);
  /**
   * @summary Try to prepare a nice label for the list view.
   * @description Admin UI can set the displayFields property. If it exists, we want to grab
   * the specified properties' values for the given feature. If our attempt results in an
   * empty string, we try with a fallback.
   *
   * @param {*} feature
   * @return {*}
   */
  const preparePrimaryLabel = (feature) => {
    return (
      featureCollection.displayFields
        .map((df) => {
          return feature.get(df);
        })
        .join(", ") || tryFallbackIfNoLabelCouldBeCreated(feature)
    );
  };
  /**
   * @summary If primary label couldn't be created using the primary algorithm,
   * let's try grabbing the ID itself. Should that fail, fallback to a hard-coded
   * string.
   *
   * @param {*} feature
   * @return {*}
   */
  const tryFallbackIfNoLabelCouldBeCreated = (feature) => {
    return feature.getId() || "(unknown feature)";
  };

  return featureCollection ? (
    selectedFeature === null ? (
      <>
        <Breadcrumbs
          setSelectedFeatureCollection={setSelectedFeatureCollection}
          featureCollection={featureCollection}
        />
        <List
          subheader={
            <ListSubheader>{featureCollection.displayName}</ListSubheader>
          }
          sx={{ width: "100%", maxWidth: 360, bgcolor: "background.paper" }}
        >
          {featureCollection.features.map((f, i) => {
            return (
              <ListItemButton
                key={i}
                onClick={() => setSelectedFeature(f.getId())}
                onMouseEnter={() => appModel.highlight(f)}
                onMouseLeave={() => appModel.highlight(false)}
              >
                <ListItemAvatar>
                  <Avatar>
                    <ImageIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText>{preparePrimaryLabel(f)}</ListItemText>
              </ListItemButton>
            );
          })}
        </List>
      </>
    ) : (
      <>
        <FeatureDetailView
          feature={featureCollection.features.find(
            (f) => f.getId() === selectedFeature
          )}
          featureCollection={featureCollection}
          selectedFeature={selectedFeature}
          setSelectedFeature={setSelectedFeature}
          selectedFeatureCollection={selectedFeatureCollection}
          setSelectedFeatureCollection={setSelectedFeatureCollection}
        />
      </>
    )
  ) : null;
};

export default FeaturesListView;
