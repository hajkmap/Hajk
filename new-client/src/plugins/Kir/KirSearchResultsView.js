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
import KirSearchResultItemView from "./KirSearchResultItemView";
import Pagination from "@material-ui/lab/Pagination";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";
import CircularProgress from "@material-ui/core/CircularProgress";

class KirSearchResultsView extends React.PureComponent {
  state = {
    resultsExpanded: true,
    open: false,
    results: { list: [] },
    paginatedResults: { list: [] },
    currentPage: 1,
    pageCount: 1,
    loading: false,
    removeFeatureByMapClickActive: false,
    addFeatureByMapClickActive: false,
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
    this.accordionList = React.createRef();
    this.sortByField = this.model.config.resultsList.sortByField.trim();
    this.genderField = this.model.config.genderField;
    this.initListeners();
  }

  initListeners = () => {
    this.localObserver.subscribe("kir.search.started", () => {
      this.clearResults();
      this.setState({ loading: true });
    });

    this.localObserver.subscribe("kir.search.error", () => {
      this.setState({ loading: false });
    });

    this.localObserver.subscribe("kir.search.remove", (feature) => {
      this.removeFeature(feature);
    });

    this.localObserver.subscribe("kir.search.completed", (features) => {
      this.setState({ loading: false });
      this.addFeatures(features, true);
    });
    this.localObserver.subscribe("kir.search.feature.selected", (feature) => {
      this.expandFeatureByMapClick(feature, true);
    });
    this.localObserver.subscribe("kir.search.feature.deselected", (feature) => {
      this.expandFeatureByMapClick(feature, false);
    });
    this.localObserver.subscribe("kir.search.clear", this.clearResults);

    this.localObserver.subscribe("kir.results.filtered", (list) => {
      this.setState({ results: { list: list } });
      this.setPage(1);
      this.forceUpdate();
    });
  };

  addFeatures = (features, clear = false) => {
    let _features = clear === true ? [] : this.state.results.list;

    _features.push(...features);

    _features.forEach((o) => {
      o.open = false;
    });

    const sortProp = this.sortByField;

    if (sortProp !== "") {
      _features.sort((a, b) =>
        a.get(sortProp) > b.get(sortProp)
          ? 1
          : b.get(sortProp) > a.get(sortProp)
          ? -1
          : 0
      );
    }

    this.updateResultList(_features, 1);
  };

  clearResults = () => {
    this.updateResultList([], 1);
  };

  expandFeatureByMapClick = (feature, expand) => {
    const index = this.state.results.list.findIndex((f) => f === feature);

    if (index > -1) {
      const foundOnPageNum = Math.floor(1 + index / this.itemsPerPage);
      this.setPage(foundOnPageNum, false);
    }

    setTimeout(() => {
      this.expandFeature(feature, expand);
    }, 25);
  };

  expandFeature(feature, expand) {
    this.state.results.list
      .filter((o) => o !== feature)
      .forEach((o) => {
        o.open = false;
      });
    feature.open = expand;

    if (expand === true) {
      setTimeout(() => {
        const openElement = this.accordionList.current.querySelector(".isopen");
        if (openElement) {
          openElement.scrollIntoView({
            behavior: "smooth",
            block: "end",
            inline: "nearest",
          });
        }
      }, 400);
    }

    this.forceUpdate();
  }

  handleItemClick(e, data) {
    this.expandFeature(data, !data.open);
    if (data.open) {
      this.localObserver.publish("kir.zoomToFeature", data);
    }
    this.localObserver.publish("kir.search.results.mark", {
      feature: data,
      open: data.open,
    });
  }

  addFeatureClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const active = !this.state.addFeatureByMapClickActive;
    this.setAddFeatureClickActive(active);
    if (this.state.removeFeatureByMapClickActive === true) {
      this.setRemoveFeatureClickActive(false);
    }
  };

  setAddFeatureClickActive = (active) => {
    this.setState({
      addFeatureByMapClickActive: active,
    });
    this.localObserver.publish("kir.search.results.addFeatureByMapClick", {
      active: active,
    });
  };

  setRemoveFeatureClickActive = (active) => {
    this.setState({
      removeFeatureByMapClickActive: active,
    });
    this.localObserver.publish("kir.search.results.removeFeatureByMapClick", {
      active: active,
    });
  };

  removeFeatureClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const active = !this.state.removeFeatureByMapClickActive;
    this.setRemoveFeatureClickActive(active);
    if (this.state.addFeatureByMapClickActive === true) {
      this.setAddFeatureClickActive(false);
    }
  };

  updateResultList = (list, page = null) => {
    this.setState({ results: { list: list } });
    setTimeout(() => {
      // push to next draw
      this.localObserver.publish("kir.results.filtered", list);
      this.setPage(page);
    }, 25);
  };

  removeFeature = (feature) => {
    let list = this.state.results.list;
    const index = list.findIndex((f) => f.ol_uid === feature.ol_uid);
    if (index >= 0) {
      let uid = list[index].ol_uid;
      list.splice(index, 1);
      this.updateResultList(list);
      this.localObserver.publish("kir.search.results.delete", uid);
    }
  };

  handleDeleteClick(e, data) {
    this.removeFeature(data);
    this.setPage(null);
  }

  setPage(pageNum, closeAll = true) {
    if (!pageNum) {
      pageNum = this.state.currentPage;
    }

    this.setState({ currentPage: pageNum });
    this.setState({
      pageCount: Math.ceil(this.state.results.list.length / this.itemsPerPage),
    });

    let start = (pageNum - 1) * this.itemsPerPage;
    let end = pageNum * this.itemsPerPage;

    if (closeAll) {
      this.state.results.list.forEach((o) => {
        o.open = false;
      });
    }
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
            <div className={classes.extendedAccordionSummary}>
              <div>
                <Badge
                  badgeContent={this.state.results.list.length}
                  color="secondary"
                  max={10000}
                  classes={{ badge: classes.badge }}
                >
                  <Typography className={classes.heading}>
                    Sökresultat
                  </Typography>
                </Badge>
              </div>
              <div>&nbsp;</div>
            </div>
          </AccordionSummary>
          <AccordionDetails style={{ display: "block", padding: 0 }}>
            <div>
              <List
                ref={this.accordionList}
                dense={true}
                component="nav"
                className={classes.listRoot}
              >
                {this.state.paginatedResults.list.map((data, index) => (
                  <div
                    key={data.ol_uid}
                    className={data.open ? "isopen" : "isclosed"}
                  >
                    {index > 0 ? <Divider /> : ""}
                    <ListItem
                      button
                      onClick={(e) => {
                        this.handleItemClick(e, data);
                      }}
                    >
                      <ListItemText
                        primary={`${
                          data.get(this.genderField) ===
                          this.model.config.genderMale
                            ? "Man"
                            : "Kvinna"
                        }, ${data.get(this.model.config.ageField)} år`}
                      />

                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          title="Ta bort"
                          className={classes.btnIcon}
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
                        <KirSearchResultItemView
                          model={data}
                          rootModel={this.model}
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
              {this.state.pageCount > 0 ? (
                <div className={classes.paginationContainer}>
                  <Pagination
                    ref={this.paginationRef}
                    color="primary"
                    defaultPage={1}
                    page={this.state.currentPage}
                    count={this.state.pageCount}
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
  btnIcon: {
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
  extendedAccordionSummary: {
    display: "flex",
    width: "100%",
    "& > div:last-child": {
      marginLeft: "auto",
    },
    "& button": {
      marginTop: "-6px",
      marginBottom: "-6px",
      marginRight: "0",
    },
    "& button:first-child": {
      marginRight: "0",
    },
  },
});

export default withStyles(styles)(withSnackbar(KirSearchResultsView));
