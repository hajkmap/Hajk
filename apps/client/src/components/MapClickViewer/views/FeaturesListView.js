import React, { useEffect, useState } from "react";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import { Divider, Typography } from "@mui/material";

import { useMapClickViewerContext } from "../MapClickViewerContext";

import Breadcrumbs from "./Breadcrumbs";
import FeatureDetailView from "./FeatureDetailView";
import FeatureIcon from "./FeatureIcon";

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
        <List>
          {featureCollection.features.map((f, i) => {
            // Let's see if there's a property with the special name (non-configurable for now).
            // If yes, we'll use the color to style the feature's background color in list. See #1385.
            const iconBgColor = f.get("_hajkiconbgcolor");
            return (
              <ListItemButton
                key={i}
                onClick={() => setSelectedFeatureId(f.getId())}
                onMouseEnter={() => appModel.highlight(f)}
                onMouseLeave={() => appModel.highlight(false)}
                component="li"
              >
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      ...(iconBgColor && { bgcolor: iconBgColor }),
                    }}
                  >
                    <FeatureIcon
                      iconNameOrUrl={featureCollection.infoclickIcon}
                    />
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
