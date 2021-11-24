import React from "react";
import PropTypes from "prop-types";
import {
  withStyles,
  Typography,
  Chip,
  IconButton,
  Box,
  Grid,
} from "@material-ui/core";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import WorkIcon from "@material-ui/icons/Work";
import Crop32Icon from "@material-ui/icons/Crop32";

const styles = (theme) => ({
  productList: {
    maxHeight: 350,
    overflowY: "scroll",
    overflowX: "hidden",
    marginTop: "10px",
  },
  listItemContainer: {
    //Override the padding of the stepper to allow more space for the results.
    paddingBottom: "5px",
    borderBottom: `${theme.spacing(0.2)}px solid ${theme.palette.divider}`,
  },
  leftChip: {
    width: "50%",
    marginLeft: "5%",
  },
  rightChip: {
    width: "50%",
    marginRight: "7%", //take the scrollbar into account.
  },
});

class ProductList extends React.PureComponent {
  state = {
    globalExportAll: false,
  };

  static propTypes = {
    projects: PropTypes.array.isRequired,
  };

  renderProjectDetails = (project) => {
    let shouldExportAll = project.exportAll;
    if (shouldExportAll) {
      return (
        <Box display="flex" justifyContent="center" gridColumnGap="5%">
          <WorkIcon />
          <Typography>{project.numBoreHolesTotal}</Typography>
        </Box>
      );
    } else {
      return (
        <Box display="flex" gridColumnGap="5%">
          <Crop32Icon />
          <Typography>{project.numBoreHolesSelected}</Typography>
        </Box>
      );
    }
  };

  render() {
    const { classes, projects, handleExportAll } = this.props;

    if (true) {
      return (
        <Grid container style={{ marginTop: "10px" }}>
          <Grid item xs={12}>
            <Box display="flex" justifyContent="center" gridColumnGap="5%">
              <Chip
                className={classes.leftChip}
                onClick={() => {
                  this.setState({ globalExportAll: false });
                  handleExportAll(false);
                }}
                icon={<Crop32Icon />}
                label="Inom markering"
                size="medium"
                variant={`${
                  this.state.globalExportAll ? "outlined" : "default"
                }`}
              />
              <Chip
                className={classes.rightChip}
                onClick={() => {
                  this.setState({ globalExportAll: true });
                  handleExportAll(true);
                }}
                icon={<WorkIcon />}
                label=" Hela projektet"
                size="medium"
                variant={`${
                  this.state.globalExportAll ? "default" : "outlined"
                }`}
              />
            </Box>
          </Grid>
          <Grid item xs={12} style={{ marginTop: "10px" }}>
            <div className={classes.productList}>
              {projects.map((project) => {
                return (
                  <Grid
                    key={project.id}
                    container
                    alignContent="center"
                    className={classes.listItemContainer}
                  >
                    <Grid item xs={12}>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography
                          noWrap
                          variant="body1"
                          style={{ fontWeight: 500 }}
                        >
                          {project.name}
                        </Typography>
                        <IconButton
                          onClick={() => {
                            console.log("show select choices");
                          }}
                          size="small"
                          aria-label="Visa projekt export val."
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Box>
                    </Grid>
                    <Grid item xs={9} md={10}>
                      <Typography>{`Id: ${project.id}`}</Typography>
                    </Grid>
                    <Grid item xs={3} md={2} style={{ paddingRight: "5%" }}>
                      <Box display="flex" gridColumnGap="5%">
                        {this.renderProjectDetails(project)}
                      </Box>
                    </Grid>
                  </Grid>
                );
              })}
            </div>
          </Grid>
        </Grid>
      );
    } else {
      return (
        <div>
          <Typography className={classes.noResultMessage}>
            Inget resultat. Gå tillbaka och markera ett nytt område.
          </Typography>
        </div>
      );
    }
  }
}
export default withStyles(styles)(ProductList);
