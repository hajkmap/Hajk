import React from "react";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import ImageIcon from "@mui/icons-material/MapTwoTone";
import { Divider, ListSubheader, Typography } from "@mui/material";

const FeaturesListView = (props) => {
  const {
    featureCollection,
    selectedFeatureCollection,
    setSelectedFeatureCollection,
  } = props;

  return (
    <>
      <Button onClick={() => setSelectedFeatureCollection(null)} fullWidth>
        Tillbaka
      </Button>
      <Divider />
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
              // selected={selectedFeatureCollection === fc.layerId}
              // onClick={() => setSelectedFeatureCollection(fc.layerId)}
            >
              <ListItemAvatar>
                <Avatar>
                  <ImageIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={f.getId()}
                // secondary={`${fc.numHits} träffar`}
              />
            </ListItemButton>
          );
        })}
      </List>
    </>
  );
};

export default FeaturesListView;
