import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { styled } from "@mui/material/styles";
import { isMobile } from "../../utils/IsMobile";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Box from "@mui/material/Box";
import Badge from "@mui/material/Badge";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Typography } from "@mui/material";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Divider from "@mui/material/Divider";
import ListItemText from "@mui/material/ListItemText";
import Collapse from "@mui/material/Collapse";
import FirSearchResultItemView from "./FirSearchResultItemView";
import Pagination from "@mui/material/Pagination";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircle from "@mui/icons-material/AddCircleOutlined";
import RemoveCircle from "@mui/icons-material/RemoveCircleOutlined";
import CircularProgress from "@mui/material/CircularProgress";
import ListItemButton from "@mui/material/ListItemButton";

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

const StyledBadge = styled(Badge)(({ _theme }) => ({
  "& span": {
    left: "auto",
    right: "-31px",
    top: "12px",
  },
}));

const TypographyHeading = styled(Typography)(({ _theme }) => ({
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
    stroke: theme.palette.error.dark,
    fill: theme.palette.error.dark,
  },
}));

const DivPaddedBottom = styled("div")(({ theme }) => ({
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  paddingBottom: theme.spacing(1),
}));

function FirSearchResultsViewCore({
  model,
  app,
  localObserver,
  eventPrefix,
  getResultLabel,
  onOpenToggled,
  onRemoveFeature,
  showMapClickTools = false,
  keepPageOnFiltered = false,
}) {
  const itemsPerPage = 10;
  const accordionList = useRef(null);
  const paginationRef = useRef(null);
  const fnsRef = useRef({});

  const sortByField = model.config.resultsList.sortByField.trim();

  const [state, setStateRaw] = useState(() => ({
    resultsExpanded: true,
    open: false,
    results: { list: [] },
    paginatedResults: { list: [] },
    currentPage: 1,
    pageCount: 1,
    loading: false,
    removeFeatureByMapClickActive: false,
    addFeatureByMapClickActive: false,
  }));
  const stateRef = useRef(state);
  const [, setTick] = useState(0);

  const setState = (patch) => {
    stateRef.current = { ...stateRef.current, ...patch };
    setStateRaw(stateRef.current);
  };

  const forceUpdate = () => {
    setTick((tick) => tick + 1);
  };

  const addFeatures = (features, clear = false) => {
    let _features = clear === true ? [] : stateRef.current.results.list;

    _features.push(...features);

    _features.forEach((o) => {
      o.open = false;
    });

    const sortProp = sortByField;

    if (sortProp !== "") {
      _features.sort((a, b) =>
        a.get(sortProp) > b.get(sortProp)
          ? 1
          : b.get(sortProp) > a.get(sortProp)
            ? -1
            : 0
      );
    }

    updateResultList(_features, 1);
  };

  const clearResults = () => {
    updateResultList([], 1);
  };

  const expandFeatureByMapClick = (feature, expand) => {
    const index = stateRef.current.results.list.findIndex((f) => f === feature);

    if (index > -1) {
      const foundOnPageNum = Math.floor(1 + index / itemsPerPage);
      setPage(foundOnPageNum, false);
    }

    setTimeout(() => {
      expandFeature(feature, expand);
    }, 25);
  };

  const expandFeature = (feature, expand) => {
    stateRef.current.results.list
      .filter((o) => o !== feature)
      .forEach((o) => {
        o.open = false;
      });
    feature.open = expand;

    if (!isMobile && expand === true) {
      setTimeout(() => {
        const openElement = accordionList.current.querySelector(".isopen");
        if (openElement) {
          openElement.scrollIntoView({
            behavior: "smooth",
            block: "end",
            inline: "nearest",
          });
        }
      }, 400);
    }

    forceUpdate();
  };

  const handleItemClick = (e, data) => {
    expandFeature(data, !data.open);
    if (data.open) {
      localObserver.publish(`${eventPrefix}.zoomToFeature`, data);
    }
    onOpenToggled && onOpenToggled(data, data.open);
  };

  const addFeatureClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const active = !stateRef.current.addFeatureByMapClickActive;
    setAddFeatureClickActive(active);
    if (stateRef.current.removeFeatureByMapClickActive === true) {
      setRemoveFeatureClickActive(false);
    }
  };

  const setAddFeatureClickActive = (active) => {
    setState({
      addFeatureByMapClickActive: active,
    });
    localObserver.publish(
      `${eventPrefix}.search.results.addFeatureByMapClick`,
      {
        active: active,
      }
    );
  };

  const setRemoveFeatureClickActive = (active) => {
    setState({
      removeFeatureByMapClickActive: active,
    });
    localObserver.publish(
      `${eventPrefix}.search.results.removeFeatureByMapClick`,
      {
        active: active,
      }
    );
  };

  const removeFeatureClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const active = !stateRef.current.removeFeatureByMapClickActive;
    setRemoveFeatureClickActive(active);
    if (stateRef.current.addFeatureByMapClickActive === true) {
      setAddFeatureClickActive(false);
    }
  };

  const updateResultList = (list, page = null) => {
    setState({ results: { list: list } });
    setTimeout(() => {
      // push to next draw
      localObserver.publish(`${eventPrefix}.results.filtered`, list);
      setPage(page);
    }, 25);
  };

  const removeFeature = (feature) => {
    let list = stateRef.current.results.list;
    const index = list.findIndex((f) => f.ol_uid === feature.ol_uid);
    if (index >= 0) {
      let uid = list[index].ol_uid;
      onRemoveFeature && onRemoveFeature(feature);
      list.splice(index, 1);
      updateResultList(list, stateRef.current.currentPage);
      localObserver.publish(`${eventPrefix}.search.results.delete`, uid);
    }
  };

  const handleDeleteClick = (e, data) => {
    e.preventDefault();
    e.stopPropagation();
    removeFeature(data);
    setPage(null);
  };

  const setPage = (pageNum, closeAll = true) => {
    if (!pageNum) {
      pageNum = stateRef.current.currentPage;
    }

    let start = (pageNum - 1) * itemsPerPage;
    let end = pageNum * itemsPerPage;

    if (closeAll) {
      stateRef.current.results.list.forEach((o) => {
        o.open = false;
      });
    }
    let list = stateRef.current.results.list.slice(start, end);

    if (list.length === 0 && pageNum > 1) {
      setPage(pageNum - 1);
    } else {
      setState({
        currentPage: pageNum,
        paginatedResults: { list: list },
        pageCount: Math.ceil(
          stateRef.current.results.list.length / itemsPerPage
        ),
      });
    }
  };

  const handlePageChange = (e, p) => {
    setPage(p);
  };

  fnsRef.current = {
    clearResults,
    addFeatures,
    removeFeature,
    expandFeatureByMapClick,
    handleSearchStarted: () => {
      clearResults();
      setState({ loading: true });
    },
    handleSearchError: () => {
      setState({ loading: false });
    },
    handleSearchAdd: (features) => {
      addFeatures(features, false);
    },
    handleSearchRemove: (feature) => {
      removeFeature(feature);
    },
    handleSearchCompleted: (features) => {
      setState({ loading: false });
      addFeatures(features, true);
    },
    handleFeatureSelected: (feature) => {
      expandFeatureByMapClick(feature, true);
    },
    handleFeatureDeselected: (feature) => {
      expandFeatureByMapClick(feature, false);
    },
    handleResultsFiltered: (list) => {
      setState({ results: { list: list } });
      keepPageOnFiltered ? setPage(stateRef.current.currentPage) : setPage(1);
      forceUpdate();
    },
    handleAddFeatureByMapClick: (data) => {
      if (data.active === false) {
        setState({ addFeatureByMapClickActive: !!data.active });
      }
    },
    handleRemoveFeatureByMapClick: (data) => {
      if (data.active === false) {
        setState({ removeFeatureByMapClickActive: !!data.active });
      }
    },
  };

  useEffect(() => {
    localObserver.subscribe(`${eventPrefix}.search.started`, () => {
      fnsRef.current.handleSearchStarted();
    });

    localObserver.subscribe(`${eventPrefix}.search.error`, () => {
      fnsRef.current.handleSearchError();
    });

    if (showMapClickTools) {
      localObserver.subscribe(`${eventPrefix}.search.add`, (features) => {
        fnsRef.current.handleSearchAdd(features);
      });
    }

    localObserver.subscribe(`${eventPrefix}.search.remove`, (feature) => {
      fnsRef.current.handleSearchRemove(feature);
    });

    localObserver.subscribe(`${eventPrefix}.search.completed`, (features) => {
      fnsRef.current.handleSearchCompleted(features);
    });
    localObserver.subscribe(
      `${eventPrefix}.search.feature.selected`,
      (feature) => {
        fnsRef.current.handleFeatureSelected(feature);
      }
    );
    localObserver.subscribe(
      `${eventPrefix}.search.feature.deselected`,
      (feature) => {
        fnsRef.current.handleFeatureDeselected(feature);
      }
    );
    localObserver.subscribe(`${eventPrefix}.search.clear`, () => {
      fnsRef.current.clearResults();
    });

    if (showMapClickTools) {
      localObserver.subscribe(
        `${eventPrefix}.search.results.addFeatureByMapClick`,
        (data) => {
          fnsRef.current.handleAddFeatureByMapClick(data);
        }
      );
      localObserver.subscribe(
        `${eventPrefix}.search.results.removeFeatureByMapClick`,
        (data) => {
          fnsRef.current.handleRemoveFeatureByMapClick(data);
        }
      );
    }
    localObserver.subscribe(`${eventPrefix}.results.filtered`, (list) => {
      fnsRef.current.handleResultsFiltered(list);
    });

    clearResults();
  }, [localObserver, fnsRef]);

  return (
    <>
      <Accordion
        expanded={state.resultsExpanded}
        onChange={() => {
          setState({
            resultsExpanded: !state.resultsExpanded,
          });
        }}
      >
        <Box sx={{ position: "relative" }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <StyledBadge
              badgeContent={state.results.list.length}
              color="secondary"
              max={10000}
            >
              <TypographyHeading>Sökresultat</TypographyHeading>
            </StyledBadge>
          </AccordionSummary>
          {showMapClickTools && (
            <Box
              sx={{
                position: "absolute",
                right: 48,
                top: "50%",
                transform: "translateY(-50%)",
                display: "flex",
                gap: 1,
              }}
            >
              <StyledIconButton
                disabled={
                  state.results.list.length === 0 ||
                  !!state.addFeatureByMapClickActive
                }
                edge="end"
                title="Ta bort"
                color={
                  state.removeFeatureByMapClickActive ? "primary" : "default"
                }
                onClick={removeFeatureClick}
              >
                <RemoveCircle />
              </StyledIconButton>
              <StyledIconButton
                disabled={!!state.removeFeatureByMapClickActive}
                edge="end"
                title="Lägg till"
                color={state.addFeatureByMapClickActive ? "primary" : "default"}
                onClick={addFeatureClick}
              >
                <AddCircle />
              </StyledIconButton>
            </Box>
          )}
        </Box>
        <AccordionDetails style={{ display: "block", padding: 0 }}>
          <div>
            <List ref={accordionList} dense={true} component="nav">
              {state.paginatedResults.list.map((data, index) => (
                <div
                  key={data.ol_uid}
                  className={data.open ? "isopen" : "isclosed"}
                >
                  {index > 0 ? <Divider /> : ""}
                  <ListItem
                    sx={{ paddingLeft: 0, paddingTop: 0, paddingBottom: 0 }}
                    secondaryAction={
                      <StyledIconButton
                        edge="end"
                        title="Ta bort"
                        onClick={(e) => {
                          handleDeleteClick(e, data);
                        }}
                      >
                        <DeleteIcon />
                      </StyledIconButton>
                    }
                  >
                    <ListItemButton
                      onClick={(e) => {
                        handleItemClick(e, data);
                      }}
                    >
                      <ListItemText primary={getResultLabel(data)} />
                    </ListItemButton>
                  </ListItem>
                  <Collapse in={data.open} timeout="auto" unmountOnExit>
                    <Divider />
                    <ResultItemData>
                      <FirSearchResultItemView
                        model={data}
                        rootModel={model}
                        app={app}
                        localObserver={localObserver}
                      />
                    </ResultItemData>
                  </Collapse>
                </div>
              ))}
              {state.results.list.length === 0 && state.loading === false ? (
                <DivPaddedBottom>Inga resultat att visa</DivPaddedBottom>
              ) : (
                ""
              )}
              {state.loading === true ? (
                <LoaderContainer>
                  <CircularProgress size={24} />
                  <span>Söker</span>
                </LoaderContainer>
              ) : (
                ""
              )}
            </List>
            {state.pageCount > 0 ? (
              <PaginationContainer>
                <Pagination
                  ref={paginationRef}
                  color="primary"
                  defaultPage={1}
                  page={state.currentPage}
                  count={state.pageCount}
                  onChange={handlePageChange}
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

FirSearchResultsViewCore.propTypes = {
  model: PropTypes.object.isRequired,
  app: PropTypes.object.isRequired,
  localObserver: PropTypes.object.isRequired,
  eventPrefix: PropTypes.oneOf(["fir", "kir"]).isRequired,
  getResultLabel: PropTypes.func.isRequired,
  onOpenToggled: PropTypes.func,
  onRemoveFeature: PropTypes.func,
  showMapClickTools: PropTypes.bool,
  keepPageOnFiltered: PropTypes.bool,
};

export default FirSearchResultsViewCore;
