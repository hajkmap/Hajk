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
} from "@material-ui/core";
import MoreVertIcon from "@material-ui/icons/MoreVert";

const styles = (theme) => ({
  productList: {
    maxHeight: 200,
    overflowY: "scroll",
    overflowX: "hidden",
  },
});

class ProductList extends React.PureComponent {
  state = {};

  static propTypes = {
    projects: PropTypes.array.isRequired,
  };

  render() {
    const { classes, projects } = this.props;

    if (projects.length > 0) {
      return (
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
