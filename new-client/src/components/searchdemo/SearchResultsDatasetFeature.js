import React from "react";

import {
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  IconButton,
  ListItemSecondaryAction,
} from "@material-ui/core";

import DetailsIcon from "@material-ui/icons/Details";

export default function SearchResultsDatasetFeature({
  feature,
  source,
  checkedItems,
  handleCheckedToggle,
  setSelectedFeatureAndSource,
}) {
  const showDetails = (e) => {
    const selectedFeatureAndSource = { feature, source };
    setSelectedFeatureAndSource(selectedFeatureAndSource);
  };

  const texts = source.displayFields.map((df) => feature.properties[df]);

  return (
    <ListItem key={feature.id} onClick={handleCheckedToggle(feature.id)}>
      <ListItemIcon>
        <Checkbox
          edge="start"
          checked={checkedItems.indexOf(feature.id) !== -1}
          tabIndex={-1}
          disableRipple
        />
      </ListItemIcon>
      <ListItemText primary={texts.shift()} secondary={texts.join(", ")} />
      <ListItemSecondaryAction>
        <IconButton onClick={showDetails} edge="end" aria-label="comments">
          <DetailsIcon />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  );
}
