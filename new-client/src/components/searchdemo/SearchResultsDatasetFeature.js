import React from "react";
import { withStyles } from "@material-ui/core/styles";

import {
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  IconButton,
  ListItemSecondaryAction,
} from "@material-ui/core";

import DetailsIcon from "@material-ui/icons/Details";

const styles = (theme) => ({});

class SearchResultsDatasetFeature extends React.PureComponent {
  state = {
    texts: this.props.source.displayFields.map(
      (df) => this.props.feature.properties[df]
    ),
  };

  showDetails = (e) => {
    const { setSelectedFeatureAndSource, feature, source } = this.props;
    const selectedFeatureAndSource = { feature, source };
    setSelectedFeatureAndSource(selectedFeatureAndSource);
  };

  render() {
    const { feature, checkedItems, handleCheckedToggle } = this.props;
    const { texts } = this.state;
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
          <IconButton
            onClick={this.showDetails}
            edge="end"
            aria-label="comments"
          >
            <DetailsIcon />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>
    );
  }
}
export default withStyles(styles)(SearchResultsDatasetFeature);
