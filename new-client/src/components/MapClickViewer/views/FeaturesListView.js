import React, { useEffect, useState } from "react";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import ImageIcon from "@mui/icons-material/MapTwoTone";
import { Divider, Typography } from "@mui/material";

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

  // If there's only ONE feature in the collection, let's pre-select it.
  // This will ensure that we render the detail view directly.
  useEffect(() => {
    const preselectedFeature =
      featureCollection?.features.length === 1
        ? featureCollection.features[0].getId()
        : null;
    setSelectedFeature(preselectedFeature || null);
  }, [featureCollection]);

  return featureCollection ? (
    selectedFeature === null ? (
      <>
        <Breadcrumbs
          setSelectedFeatureCollection={setSelectedFeatureCollection}
          featureCollection={featureCollection}
        />
        <Divider />
        <Typography
          variant="button"
          component="div"
          noWrap
          sx={{
            maxWidth: "100%",
            fontSize: 18,
            paddingTop: 1,
            paddingBottom: 1,
          }}
        >
          {featureCollection.displayName}
        </Typography>
        <Divider />
        <List
          sx={{ width: "100%", maxWidth: 360, bgcolor: "background.paper" }}
        >
          {featureCollection.features.sort(compare).map((f, i) => {
            return (
              <ListItemButton
                key={i}
                onClick={() => setSelectedFeature(f.getId())}
                onMouseEnter={() => appModel.highlight(f)}
                onMouseLeave={() => appModel.highlight(false)}
                component="li"
              >
                <ListItemAvatar>
                  <Avatar>
                    <ImageIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText>{f.primaryLabel}</ListItemText>
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

// Basic compare function used for alphabetic sorting of features using the primaryLabel property
const compare = (a, b) => a.primaryLabel.localeCompare(b.primaryLabel);

export default FeaturesListView;
