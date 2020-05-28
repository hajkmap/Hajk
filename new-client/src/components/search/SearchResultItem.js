import React from "react";
import { withStyles } from "@material-ui/core/styles";

import MuiListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import IconButton from "@material-ui/core/IconButton";
import MoreVertIcon from "@material-ui/icons/MoreVert";

const ListItem = withStyles(theme => ({
  root: {
    borderBottom: "1px solid rgba(0, 0, 0, .125)",
    padding: theme.spacing(2)
  }
}))(MuiListItem);

const SearchResultItem = props => {
  const displayFields = props.displayFields;
  const renderRow = props.features.map(feature => {
    return (
      <ListItem button key={feature.id}>
        <ListItemText primary={feature.properties[displayFields]} />
        <ListItemSecondaryAction>
          <IconButton edge="end" aria-label="moreVert">
            <MoreVertIcon />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>
    );
  });

  return renderRow;
};

export default SearchResultItem;
