import React from "react";
import PropTypes from "prop-types";
import {
  withStyles,
  Typography,
  List,
  ListItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Chip,
} from "@material-ui/core";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import WorkIcon from "@material-ui/icons/Work";
import Crop32Icon from "@material-ui/icons/Crop32";

const styles = (theme) => ({
  productList: {
    maxHeight: 200,
    overflowY: "scroll",
    overflowX: "hidden",
  },
  chipContainer: {
    maxWidth: "100%",
    display: "flex",
    marginBottom: theme.spacing(2),
  },
  leftChip: {
    marginRight: theme.spacing(1),
  },
});

class ProductList extends React.PureComponent {
  state = {};

  static propTypes = {
    projects: PropTypes.array.isRequired,
  };

  render() {
    const { classes, projects, handleExportAll } = this.props;

    if (projects.length > 0) {
      return (
        <>
          <div className={classes.chipContainer}>
            <Chip
              onClick={() => {
                handleExportAll(true);
              }}
              className={classes.leftChip}
              icon={<WorkIcon />}
              label="Hela projektet"
              color="primary"
              size="small"
            />
            <Chip
              onClick={() => {
                handleExportAll(false);
              }}
              icon={<Crop32Icon />}
              label="Inom markering"
              color="primary"
              size="small"
            />
          </div>
          <div className={classes.productList}>
            <List>
              {projects.map((project) => {
                return (
                  <ListItem key={project.id} divider>
                    <Accordion className={classes.accordion} elevation={0}>
                      <AccordionSummary>
                        <Grid
                          className={classes.accordion}
                          wrap="nowrap"
                          alignItems="center"
                          container
                          onClick={() => {
                            console.log("Project clicked");
                          }}
                        >
                          <Typography noWrap>{project.name}</Typography>
                          <MoreVertIcon />
                        </Grid>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography>Example</Typography>
                      </AccordionDetails>
                    </Accordion>
                  </ListItem>
                );
              })}
            </List>
          </div>
        </>
      );
    } else {
      return (
        <div>
          <Typography>Ingen resultat</Typography>
        </div>
      );
    }
  }
}
export default withStyles(styles)(ProductList);
