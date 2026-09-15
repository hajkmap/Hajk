import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
import { Typography } from "@mui/material";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Select from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import Input from "@mui/material/Input";

import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import FirToolbarView from "./FirToolbarView";

const StyledFormControlLabel = styled(FormControlLabel)(({ _theme }) => ({
  fontSize: "0.875rem",
  fontWeight: "400",
}));

const TypographyHeading = styled(Typography)(({ _theme }) => ({
  fontWeight: 500,
}));

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const StyledFormControl2 = styled(FormControl)(({ theme }) => ({
  marginBottom: theme.spacing(1),
}));

const StyledCheckbox = styled(Checkbox)(({ _theme }) => ({
  paddingTop: "0.25rem",
  paddingBottom: "0.25rem",
}));

const ButtonClear = styled(Button)(({ theme }) => ({
  marginRight: theme.spacing(2),
}));

const ContainerTopPadded = styled("div")(({ theme }) => ({
  paddingTop: theme.spacing(2),
}));

const CircularProgressButton = styled(CircularProgress)(({ _theme }) => ({
  position: "absolute",
  top: "50%",
  left: "50%",
  marginTop: -12,
  marginLeft: -12,
}));

function FirSearchView({ model, app, localObserver }) {
  const searchTm = useRef(null);
  const fnsRef = useRef({});

  const [state, setStateRaw] = useState(() => ({
    searchText: "",
    searchPanelExpanded: true,
    neighborExpanded: false,
    searchType: "",
    buffer: 0,
    files: { list: [] },
    exactMatch: true,
    showDesignation: true,
    showSearchArea: true,
    loading: false,
    searchTypeId:
      model.searchTypes.length > 0 ? model.searchTypes[0].id : undefined,
  }));
  const stateRef = useRef(state);

  const setState = (patch) => {
    stateRef.current = { ...stateRef.current, ...patch };
    setStateRaw(stateRef.current);
  };

  const handleClearSearch = () => {
    localObserver.publish("fir.search.clear", {});
    setState({ searchText: "" });
  };

  const handleSearch = (overrideOptions = {}) => {
    let options = {
      text: stateRef.current.searchText,
      exactMatch: stateRef.current.exactMatch || false,
      showDesignation: stateRef.current.showDesignation || false,
      showSearchArea: stateRef.current.showSearchArea || false,
      buffer: stateRef.current.buffer || 0,
      searchTypeId: stateRef.current.searchTypeId,
      zoomToLayer: true,
    };

    options = { ...options, ...overrideOptions };

    localObserver.publish("fir.search.search", options);
  };

  const handleSearchTextChange = (e) => {
    setState({
      searchText: e.target.value || "",
    });
    if (e.target.value && e.target.value.length >= 4) {
      // Throttle!
      clearTimeout(searchTm.current);
      searchTm.current = setTimeout(() => {
        handleSearch({ zoomToLayer: false });
      }, 500);
    }
  };

  const handleMultilinePaste = (text) => {
    const separationChar = text.indexOf("  ") > -1 ? "  " : "\t";

    const notEmptyFilter = (s) => {
      return s.indexOf(separationChar) !== 0 && s.trim() !== "";
    };
    const texts = text
      .split("\n")
      .filter(notEmptyFilter)
      .map((line) => {
        return line.trim().split(separationChar)[0];
      })
      .filter(notEmptyFilter)
      .reduce((acc, text) => {
        if (!acc.includes(text)) {
          acc.push(text);
        }
        return acc;
      }, [])
      .join(", ");

    setState({ searchText: texts });
    searchTm.current = setTimeout(() => {
      handleSearch({ zoomToLayer: false });
    }, 500);
  };

  const handlePaste = (e) => {
    try {
      const cbText = e?.clipboardData?.getData("text").trim();
      if (cbText && cbText.indexOf("\n") > -1) {
        e.preventDefault();
        handleMultilinePaste(cbText);
      }
    } catch (error) {
      console.log("Error when pasting: ", error);
    }
  };

  fnsRef.current = {
    handleSearchStarted: () => {
      setState({ loading: true });
    },
    handleSearchCompleted: () => {
      setState({ loading: false });
    },
    handleSearchError: () => {
      setState({ loading: false });
    },
  };

  useEffect(() => {
    localObserver.subscribe("fir.search.started", () => {
      fnsRef.current.handleSearchStarted();
    });
    localObserver.subscribe("fir.search.completed", () => {
      fnsRef.current.handleSearchCompleted();
    });
    localObserver.subscribe("fir.search.error", () => {
      fnsRef.current.handleSearchError();
    });
  }, [localObserver, fnsRef]);

  return (
    <>
      <Accordion
        expanded={state.searchPanelExpanded}
        onChange={() => {
          setState({
            searchPanelExpanded: !state.searchPanelExpanded,
          });
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <TypographyHeading>Sök fastigheter</TypographyHeading>
        </AccordionSummary>
        <AccordionDetails style={{ display: "block" }}>
          <div>
            <StyledFormControl fullWidth={true} variant="standard">
              <InputLabel id="FirSearchType">Sök på</InputLabel>
              <Select
                labelId="FirSearchType"
                value={state.searchTypeId}
                variant="standard"
                onChange={(e) => {
                  setState({ searchTypeId: e.target.value });
                }}
              >
                {model.searchTypes
                  .filter((item) => {
                    return item.visibleInDropDown !== false;
                  })
                  .map((item, _index) => (
                    <MenuItem key={`fir-searchType-${item.id}`} value={item.id}>
                      {item.caption}
                    </MenuItem>
                  ))}
              </Select>
            </StyledFormControl>
          </div>
          <div>
            <StyledFormControl2 fullWidth={true}>
              <Input
                id="input-with-icon-adornment"
                placeholder="Söktext"
                onChange={handleSearchTextChange}
                onKeyPress={(e) => {
                  if (e.key.toLowerCase() === "enter") {
                    handleSearch();
                    e.preventDefault();
                  }
                }}
                onPaste={handlePaste}
                value={state.searchText}
                startAdornment={
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                }
              />
            </StyledFormControl2>
          </div>
          <div>
            <FormControl fullWidth={true}>
              <StyledFormControlLabel
                control={
                  <StyledCheckbox
                    checked={state.exactMatch}
                    onChange={(e) => {
                      setState({ exactMatch: e.target.checked });
                    }}
                    color="primary"
                  />
                }
                label="Exakt matchning på text"
              />
            </FormControl>
            <FormControl fullWidth={true}>
              <StyledFormControlLabel
                control={
                  <StyledCheckbox
                    checked={state.showDesignation}
                    onChange={(e) => {
                      setState({ showDesignation: e.target.checked });
                      localObserver.publish("fir.layers.showDesignation", {
                        value: e.target.checked,
                      });
                    }}
                    color="primary"
                  />
                }
                label="Visa fastighetsbeteckning"
              />
            </FormControl>
            <StyledFormControl fullWidth={true}>
              <StyledFormControlLabel
                control={
                  <StyledCheckbox
                    checked={state.showSearchArea}
                    onChange={(e) => {
                      setState({ showSearchArea: e.target.checked });
                      localObserver.publish("fir.layers.showSearchArea", {
                        value: e.target.checked,
                      });
                    }}
                    color="primary"
                  />
                }
                label="Visa buffer/sökområde"
              />
            </StyledFormControl>
          </div>

          <FirToolbarView
            model={model}
            app={app}
            localObserver={localObserver}
          />

          <ContainerTopPadded style={{ textAlign: "right" }}>
            <ButtonClear
              variant="outlined"
              color="primary"
              component="span"
              size="small"
              onClick={handleClearSearch}
            >
              Rensa
            </ButtonClear>
            <Button
              variant="contained"
              color="primary"
              component="span"
              size="small"
              onClick={handleSearch}
              disabled={state.loading}
            >
              Sök
              {state.loading && <CircularProgressButton size={24} />}
            </Button>
          </ContainerTopPadded>
        </AccordionDetails>
      </Accordion>
    </>
  );
}

FirSearchView.propTypes = {
  model: PropTypes.object.isRequired,
  app: PropTypes.object.isRequired,
  localObserver: PropTypes.object.isRequired,
};

export default FirSearchView;
