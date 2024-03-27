import React from "react";
import PropTypes from "prop-types";
import { styled } from "@mui/material/styles";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Badge from "@mui/material/Badge";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Typography } from "@mui/material";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Collapse from "@mui/material/Collapse";
import FirSearchResultItemView from "./FirSearchResultItemView";
import Pagination from "@mui/material/Pagination";
import ListItemSecondaryAction from "@mui/material/ListItemSecondaryAction";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircle from "@mui/icons-material/AddCircleOutline";
import RemoveCircle from "@mui/icons-material/RemoveCircleOutline";
import CircularProgress from "@mui/material/CircularProgress";

const LoaderContainer = styled("div")(({ theme }) => ({
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  paddingBottom: theme.spacing(1),
  display: "flex",
  alignItems: "center",
  "& > span:first-of-type": {
    padding: "1px",
    marginTop: "-3px",
    marginRight: theme.spacing(1),
  },
}));

const StyledBadge = styled(Badge)(({ theme }) => ({
  "& span": {
    left: "auto",
    right: "-31px",
    top: "12px",
  },
}));

const TypographyHeading = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
}));

const Spacer = styled("div")(({ theme }) => ({
  height: theme.spacing(2),
}));

const ResultItemData = styled("div")(({ theme }) => ({
  padding: theme.spacing(2),
}));

const PaginationContainer = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "right",
  paddingRight: theme.spacing(2),
  paddingBottom: theme.spacing(2),
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  right: "6px",
  padding: "6px",

  "&:hover svg": {
    color: theme.palette.error.dark,
    stoke: theme.palette.error.dark,
    fill: theme.palette.error.dark,
  },
}));

const DivPaddedBottom = styled("div")(({ theme }) => ({
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  paddingBottom: theme.spacing(1),
}));

const ExtendedAccordionSummary = styled("div")(({ theme }) => ({
  display: "flex",
  width: "100%",

  "& > div:last-of-type": {
    marginLeft: "auto",
  },

  "& button": {
    marginTop: "-6px",
    marginBottom: "-6px",
    marginRight: "0",
  },

  "& button:first-of-type": {
    marginRight: "0",
  },
}));

class FirSearchResultsView extends React.PureComponent {
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
    this.textField = this.model.config.resultsList.textField.trim();
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

    this.localObserver.subscribe("fir.search.add", (features) => {
      this.addFeatures(features, false);
    });

    this.localObserver.subscribe("fir.search.remove", (feature) => {
      this.removeFeature(feature);
    });

    this.localObserver.subscribe("fir.search.completed", (features) => {
      this.setState({ loading: false });
      this.addFeatures(features, true);
    });
    this.localObserver.subscribe("fir.search.feature.selected", (feature) => {
      this.expandFeatureByMapClick(feature, true);
    });
    this.localObserver.subscribe("fir.search.feature.deselected", (feature) => {
      this.expandFeatureByMapClick(feature, false);
    });
    this.localObserver.subscribe("fir.search.clear", this.clearResults);

    this.localObserver.subscribe(
      "fir.search.results.addFeatureByMapClick",
      (data) => {
        if (data.active === false) {
          this.setState({ addFeatureByMapClickActive: data.active });
        }
      }
    );
    this.localObserver.subscribe(
      "fir.search.results.removeFeatureByMapClick",
      (data) => {
        if (data.active === false) {
          this.setState({ removeFeatureByMapClickActive: data.active });
        }
      }
    );
    this.localObserver.subscribe("fir.results.filtered", (list) => {
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

  highlight = (feature, _highlight = false) => {
    this.localObserver.publish("fir.search.results.highlight", {
      feature: feature,
      highlight: _highlight,
    });
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
      this.localObserver.publish("fir.zoomToFeature", data);
    }
    this.highlight(data, data.open);
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
    this.localObserver.publish("fir.search.results.addFeatureByMapClick", {
      active: active,
    });
  };

  setRemoveFeatureClickActive = (active) => {
    this.setState({
      removeFeatureByMapClickActive: active,
    });
    this.localObserver.publish("fir.search.results.removeFeatureByMapClick", {
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
      this.localObserver.publish("fir.results.filtered", list);
      this.setPage(page);
    }, 25);
  };

  removeFeature = (feature) => {
    let list = this.state.results.list;
    const index = list.findIndex((f) => f.ol_uid === feature.ol_uid);
    if (index >= 0) {
      let uid = list[index].ol_uid;
      this.highlight(null, false);
      list.splice(index, 1);
      this.updateResultList(list);
      this.localObserver.publish("fir.search.results.delete", uid);
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
    return (
      <>
        <Accordion
          expanded={this.state.resultsExpanded}
          onChange={() => {
            this.setState({
              resultsExpanded: !this.state.resultsExpanded,
            });
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <ExtendedAccordionSummary>
              <div>
                <StyledBadge
                  badgeContent={this.state.results.list.length}
                  color="secondary"
                  max={10000}
                >
                  <TypographyHeading>Sökresultat</TypographyHeading>
                </StyledBadge>
              </div>
              <div>
                <StyledIconButton
                  disabled={
                    this.state.results.list.length === 0 ||
                    this.state.addFeatureByMapClickActive === true
                  }
                  edge="end"
                  title="Ta bort"
                  color={
                    this.state.removeFeatureByMapClickActive
                      ? "primary"
                      : "default"
                  }
                  onClick={this.removeFeatureClick}
                >
                  <RemoveCircle />
                </StyledIconButton>
                <StyledIconButton
                  disabled={this.state.removeFeatureByMapClickActive === true}
                  edge="end"
                  title="Lägg till"
                  color={
                    this.state.addFeatureByMapClickActive
                      ? "primary"
                      : "default"
                  }
                  onClick={this.addFeatureClick}
                >
                  <AddCircle />
                </StyledIconButton>
              </div>
            </ExtendedAccordionSummary>
          </AccordionSummary>
          <AccordionDetails style={{ display: "block", padding: 0 }}>
            <div>
              <List ref={this.accordionList} dense={true} component="nav">
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
                      <ListItemText primary={data.get(this.textField)} />

                      <ListItemSecondaryAction>
                        <StyledIconButton
                          edge="end"
                          title="Ta bort"
                          onClick={(e) => {
                            this.handleDeleteClick(e, data);
                          }}
                        >
                          <DeleteIcon />
                        </StyledIconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Collapse in={data.open} timeout="auto" unmountOnExit>
                      <Divider />
                      <ResultItemData>
                        <FirSearchResultItemView
                          model={data}
                          rootModel={this.model}
                          app={this.props.app}
                          localObserver={this.localObserver}
                        />
                      </ResultItemData>
                    </Collapse>
                  </div>
                ))}
                {this.state.results.list.length === 0 &&
                this.state.loading === false ? (
                  <DivPaddedBottom>Inga resultat att visa</DivPaddedBottom>
                ) : (
                  ""
                )}
                {this.state.loading === true ? (
                  <LoaderContainer>
                    <CircularProgress size={24} />
                    <span>Söker</span>
                  </LoaderContainer>
                ) : (
                  ""
                )}
              </List>
              {this.state.pageCount > 0 ? (
                <PaginationContainer>
                  <Pagination
                    ref={this.paginationRef}
                    color="primary"
                    defaultPage={1}
                    page={this.state.currentPage}
                    count={this.state.pageCount}
                    onChange={this.handlePageChange}
                    size="small"
                  />
                </PaginationContainer>
              ) : (
                ""
              )}
            </div>
          </AccordionDetails>
        </Accordion>
        <Spacer></Spacer>
      </>
    );
  }
}

export default FirSearchResultsView;
