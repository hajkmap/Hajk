import React from "react";
import { withStyles } from "@material-ui/core/styles";

import { ListItemIcon, Checkbox } from "@material-ui/core";
import MuiListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import IconButton from "@material-ui/core/IconButton";
import Typography from "@material-ui/core/Typography";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import {
  extractPropertiesFromJson,
  mergeFeaturePropsWithMarkdown,
} from "../../utils/FeaturePropsParsing";

const ListItem = withStyles((theme) => ({
  root: {
    borderBottom: "1px solid rgba(0, 0, 0, .125)",
    padding: theme.spacing(2),
  },
}))(MuiListItem);

const getHtmlItemInfoBox = (feature, infoBox) => {
  var properties = extractPropertiesFromJson(feature.properties);
  feature.properties = properties;
  return mergeFeaturePropsWithMarkdown(infoBox, feature.properties);
};

function SearchResultItem({
  feature,
  source,
  checkedItems,
  handleCheckedToggle,
}) {
  const displayFields = source.displayFields;
  const infobox = source.infobox;
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
      <ListItemText
        primary={feature.properties[displayFields]}
        secondary={
          <React.Fragment>
            <Typography
              component="span"
              variant="body2"
              color="textPrimary"
              dangerouslySetInnerHTML={getHtmlItemInfoBox(feature, infobox)}
            />
          </React.Fragment>
        }
      />

      <ListItemSecondaryAction>
        <IconButton edge="end" aria-label="moreVert">
          <MoreVertIcon />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  );
}

export default SearchResultItem;
