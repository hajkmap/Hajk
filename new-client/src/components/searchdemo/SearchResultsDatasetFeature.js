import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";

import {
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  IconButton,
  ListItemSecondaryAction,
} from "@material-ui/core";
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
  Typography,
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
        <Grid container>
          <Grid item xs={12}>
            <ListItemText
              primary={texts.shift()}
              secondary={texts.join(", ")}
            />
          </Grid>
          <Grid item xs={12}>
            <Table>
              <TableBody>
                {Object.entries(feature.properties).map((row) => (
                  <TableRow key={row[0]}>
                    <TableCell>{row[0]}</TableCell>
                    <TableCell align="right">{row[1]}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Grid>
        </Grid>
      </ListItem>
    );
  }
}
export default withStyles(styles)(SearchResultsDatasetFeature);
