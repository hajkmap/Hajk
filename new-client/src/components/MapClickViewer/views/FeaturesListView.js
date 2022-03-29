import React, { useEffect, useState } from "react";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import Icon from "@mui/material/Icon";
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

  const [selectedFeatureId, setSelectedFeatureId] = useState(null);

  // If there's only ONE feature in the collection, let's pre-select it.
  // This will ensure that we render the detail view directly.
  useEffect(() => {
    const preselectedFeature =
      featureCollection?.features.length === 1
        ? featureCollection.features[0].getId()
        : null;
    setSelectedFeatureId(preselectedFeature || null);
  }, [featureCollection]);

  return featureCollection ? (
    selectedFeatureId === null ? (
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
          {featureCollection.features.map((f, i) => {
            return (
              <ListItemButton
                key={i}
                onClick={() => setSelectedFeatureId(f.getId())}
                onMouseEnter={() => appModel.highlight(f)}
                onMouseLeave={() => appModel.highlight(false)}
                component="li"
              >
                <ListItemAvatar>
                  <Avatar>
                    {featureCollection.infoclickIcon.trim().length > 0 ? (
                      <Icon>{featureCollection.infoclickIcon}</Icon>
                    ) : (
                      <ImageIcon />
                    )}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={f.primaryLabel}
                  secondary={f.secondaryLabel}
                ></ListItemText>
              </ListItemButton>
            );
          })}
        </List>
      </>
    ) : (
      <>
        <FeatureDetailView
          feature={featureCollection.features.find(
            (f) => f.getId() === selectedFeatureId
          )}
          featureCollection={featureCollection}
          selectedFeatureId={selectedFeatureId}
          setSelectedFeatureId={setSelectedFeatureId}
          selectedFeatureCollection={selectedFeatureCollection}
          setSelectedFeatureCollection={setSelectedFeatureCollection}
        />
      </>
    )
  ) : null;
};

export default FeaturesListView;
