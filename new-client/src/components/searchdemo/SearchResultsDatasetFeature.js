import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import cslx from "clsx";
import { ListItem, ListItemText } from "@material-ui/core";
import { Table, TableBody, TableRow, TableCell } from "@material-ui/core";

const styles = (theme) => ({
  hidden: {
    display: "none",
  },
});

class SearchResultsDatasetFeature extends React.PureComponent {
  state = {
    showAllInformation: false,
  };

  showDetails = (e) => {
    const { setSelectedFeatureAndSource, feature, source } = this.props;
    const selectedFeatureAndSource = { feature, source };
    setSelectedFeatureAndSource(selectedFeatureAndSource);
  };

  render() {
    const { feature, handleCheckedToggle, classes, source } = this.props;
    const { showAllInformation } = this.state;
    let texts = source.displayFields.map((df) => feature.properties[df]);

    return (
      <ListItem key={feature.id}>
        <Grid container>
          <Grid item xs={12}>
            <ListItemText
              primary={
                <Button
                  style={{ width: "100%" }}
                  onClick={handleCheckedToggle(feature.id)}
                >
                  {" "}
                  {texts.shift()}{" "}
                </Button>
              }
              secondary={texts.join(", ")}
            />
          </Grid>
          <Grid item xs={12}>
            <Table size={"small"} style={{ maxWidth: "100%" }}>
              <TableBody>
                {Object.entries(feature.properties).map((row, index) => {
                  if (index >= 2) {
                    return (
                      <TableRow
                        className={cslx(
                          !showAllInformation ? classes.hidden : null
                        )}
                        key={row[0]}
                      >
                        <TableCell>{row[0]}</TableCell>
                        <TableCell align="right">{row[1]}</TableCell>
                      </TableRow>
                    );
                  } else {
                    return (
                      <TableRow key={row[0]}>
                        <TableCell>{row[0]}</TableCell>
                        <TableCell align="right">{row[1]}</TableCell>
                      </TableRow>
                    );
                  }
                })}
              </TableBody>
            </Table>
          </Grid>
          <Grid item xs={12}>
            <Button
              color="primary"
              style={{ width: "100%" }}
              onClick={() =>
                this.setState({
                  showAllInformation: !this.state.showAllInformation,
                })
              }
            >
              {showAllInformation ? "Visa mindre" : "Visa mer"}
            </Button>
          </Grid>
        </Grid>
      </ListItem>
    );
  }
}
export default withStyles(styles)(SearchResultsDatasetFeature);
