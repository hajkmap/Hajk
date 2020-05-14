import React from "react";

import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";

const SearchResultItem = props => {
  const displayFields = props.displayFields;
  const renderRow = props.features.map(feature => {
    return (
      <ListItem button key={feature.id}>
        <ListItemText primary={feature.properties[displayFields]} />
      </ListItem>
    );
  });

  return renderRow;
};

export default SearchResultItem;
