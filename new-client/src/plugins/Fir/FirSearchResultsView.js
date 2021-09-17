import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import Badge from "@material-ui/core/Badge";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import { Typography } from "@material-ui/core";
import List from "@material-ui/core/List";
import Divider from "@material-ui/core/Divider";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Collapse from "@material-ui/core/Collapse";
import FirSearchResultItemView from "./FirSearchResultItemView";
import Pagination from "@material-ui/lab/Pagination";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";
import CircularProgress from "@material-ui/core/CircularProgress";

class FirView extends React.PureComponent {
  state = {
    resultsExpanded: true,
    open: false,
    results: { list: [] },
    paginatedResults: { list: [] },
    currentPage: 1,
    loading: false,
  };

  static propTypes = {
    model: PropTypes.object.isRequired,
    app: PropTypes.object.isRequired,
    localObserver: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
  };

  static defaultProps = {};

  componentDidMount() {
    this.clearResults();
  }

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.localObserver = this.props.localObserver;
    this.globalObserver = this.props.app.globalObserver;
    this.itemsPerPage = 10;
    this.initListeners();
  }

  initListeners = () => {
    this.localObserver.subscribe("fir.search.started", () => {
      this.clearResults();
      this.setState({ loading: true });
    });

    this.localObserver.subscribe("fir.search.error", () => {
      this.setState({ loading: false });
    });

    this.localObserver.subscribe("fir.search.completed", (features) => {
      this.setState({ loading: false });
      features.forEach((o) => {
        o.open = false;
      });
      let sortProp = "fastbet";
      features.sort((a, b) =>
        a[sortProp] > b[sortProp] ? 1 : b[sortProp] > a[sortProp] ? -1 : 0
      );
      this.setState({ results: { list: features } });
      this.setPage(1);
    });
    this.localObserver.subscribe("fir.search.feature.selected", (feature) => {
      this.expandFeature(feature, true);
    });
    this.localObserver.subscribe("fir.search.feature.deselected", (feature) => {
      this.expandFeature(feature, false);
    });
    this.localObserver.subscribe("fir.search.clear", this.clearResults);
  };

  clearResults = () => {
    this.setState({ results: { list: [] } });

    setTimeout(() => {
      // push to next draw
      this.setPage(1);
    }, 25);
  };

  highlight = (feature, _highlight = false) => {
    this.localObserver.publish("fir.search.results.highlight", {
      feature: feature,
      highlight: _highlight,
    });
  };

  expandFeature = (feature, expand) => {
    this.state.results.list
      .filter((o) => o !== feature)
      .forEach((o) => {
        o.open = false;
      });
    feature.open = expand;
    this.forceUpdate();
  };

  handleItemClick(e, data) {
    this.expandFeature(data, !data.open);

    this.highlight(data, data.open);
    this.forceUpdate();
  }

  handleDeleteClick(e, data) {
    let list = this.state.results.list;
    let index = list.findIndex((element) => element.ol_uid === data.ol_uid);
    if (index >= 0) {
      let uid = list[index].ol_uid;
      this.highlight(null, false);
      list.splice(index, 1);
      this.setState({ results: { list: list } });
      this.localObserver.publish("fir.search.results.delete", uid);
    }

    this.setPage(null);
  }

  paginationPageCount() {
    return Math.round(this.state.results.list.length / this.itemsPerPage);
  }

  setPage(pageNum) {
    if (!pageNum) {
      pageNum = this.state.currentPage;
    }
    this.setState({ currentPage: pageNum });
    let start = (pageNum - 1) * this.itemsPerPage;
    let end = pageNum * this.itemsPerPage;
    this.state.results.list.forEach((o) => {
      o.open = false;
    });
    let list = this.state.results.list.slice(start, end);

    if (list.length === 0 && pageNum > 1) {
      this.setPage(pageNum - 1);
    } else {
      this.setState({ paginatedResults: { list: list } });
    }
  }

  handlePageChange = (e, p) => {
    this.setPage(p);
  };

  render() {
    const { classes } = this.props;

    return (
      <>
        <Accordion
          expanded={this.state.resultsExpanded}
          className={classes.bottom}
          onChange={() => {
            this.setState({
              resultsExpanded: !this.state.resultsExpanded,
            });
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Badge
              badgeContent={this.state.results.list.length}
              color="secondary"
              max={999}
              classes={{ badge: classes.badge }}
            >
              <Typography className={classes.heading}>Sökresultat</Typography>
            </Badge>
          </AccordionSummary>
          <AccordionDetails style={{ display: "block", padding: 0 }}>
            <div>
              <List dense={true} component="nav" className={classes.listRoot}>
                {this.state.paginatedResults.list.map((data, index) => (
                  <div key={data.ol_uid}>
                    {index > 0 ? <Divider /> : ""}
                    <ListItem
                      button
                      onClick={(e) => {
                        this.handleItemClick(e, data);
                      }}
                    >
                      <ListItemText primary={data.get("fastbet")} />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          className={classes.btnDelete}
                          onClick={(e) => {
                            this.handleDeleteClick(e, data);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Collapse in={data.open} timeout="auto" unmountOnExit>
                      <Divider />
                      <div className={classes.resultItemData}>
                        <FirSearchResultItemView
                          model={data}
                          app={this.props.app}
                          localObserver={this.localObserver}
                        />
                      </div>
                    </Collapse>
                  </div>
                ))}
                {this.state.results.list.length === 0 &&
                this.state.loading === false ? (
                  <div className={classes.paddedBottom}>
                    Inga resultat att visa
                  </div>
                ) : (
                  ""
                )}
                {this.state.loading === true ? (
                  <div
                    className={`${classes.paddedBottom} ${classes.loaderContainer}`}
                  >
                    <CircularProgress
                      size={24}
                      className={classes.buttonProgress}
                    />
                    <span>Söker</span>
                  </div>
                ) : (
                  ""
                )}
              </List>
              {this.paginationPageCount() > 0 ? (
                <div className={classes.paginationContainer}>
                  <Pagination
                    color="primary"
                    defaultPage={1}
                    count={this.paginationPageCount()}
                    onChange={this.handlePageChange}
                    size="small"
                  />
                </div>
              ) : (
                ""
              )}
            </div>
          </AccordionDetails>
        </Accordion>
        <div className={classes.spacer}></div>
      </>
    );
  }
}

const styles = (theme) => ({
  heading: {
    fontWeight: 500,
  },
  badge: {
    top: "11px",
    right: "-26px",
  },
  spacer: {
    height: theme.spacing(2),
  },
  resultItemData: {
    padding: theme.spacing(2),
  },
  paginationContainer: {
    display: "flex",
    justifyContent: "right",
    paddingRight: theme.spacing(2),
    paddingBottom: theme.spacing(2),
  },
  btnDelete: {
    right: "6px",
    padding: "6px",
    "&:hover svg": {
      color: theme.palette.error.dark,
      stoke: theme.palette.error.dark,
      fill: theme.palette.error.dark,
    },
  },
  paddedBottom: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    paddingBottom: theme.spacing(1),
  },
  loaderContainer: {
    display: "flex",
    alignItems: "center",
    "& > span": {
      paddingLeft: theme.spacing(1),
    },
  },
});

export default withStyles(styles)(withSnackbar(FirView));
