import React from "react";
import PropTypes from "prop-types";
import {
  withStyles,
  Typography,
  Chip,
  IconButton,
  Badge,
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
  listItemContainer: {
    paddingLeft: "0",
    paddingTop: "5px",
    paddingBottom: "5px",
    borderBottom: `${theme.spacing(0.2)}px solid ${theme.palette.divider}`,
  },
  listItem: {
    display: "flex",
    justifyContent: "space-between",
  },
  listItemText: {
    display: "flex",
    alignItems: "center",
    maxWidth: "80%",
  },
  itemButtons: {
    display: "flex",
    alignItems: "center",
    marginLeft: theme.spacing(1),
  },
  itemButton: {
    padding: theme.spacing(0.3),
  },
  badge: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
  },
  noResultMessage: {
    display: "flex",
    justifyContent: "center",
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    fontWeight: theme.typography.fontWeightMedium,
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
            {projects.map((project) => {
              return (
                <div key={project.id} className={classes.listItemContainer}>
                  <div className={classes.listItem}>
                    <div id="itemText" className={classes.listItemText}>
                      <Typography noWrap>{project.name}</Typography>
                    </div>
                    <div className={classes.itemButtons}>
                      <div className={classes.itemButton}>
                        <IconButton
                          onClick={() => {
                            console.log("show select choices");
                          }}
                          aria-label=""
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </div>
                    </div>
                  </div>
                  <div className={classes.listItem}>
                    <div>
                      <Typography>{`${project.id}`}</Typography>
                    </div>
                    {project.exportAll ? (
                      <div className={classes.badge}>
                        <Badge
                          badgeContent={project.numBoreHolesTotal}
                          color="primary"
                        >
                          <WorkIcon />
                        </Badge>
                      </div>
                    ) : (
                      <div className={classes.badge}>
                        <Badge
                          badgeContent={project.numBoreHolesSelected}
                          color="primary"
                        >
                          <Crop32Icon />
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      );
    } else {
      return (
        <div>
          <Typography className={classes.noResultMessage}>
            Inga resultat
          </Typography>
        </div>
      );
    }
  }
}
export default withStyles(styles)(ProductList);
