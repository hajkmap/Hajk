import React from "react";
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

const StyledFormControlLabel = styled(FormControlLabel)(({ theme }) => ({
  fontSize: "0.875rem",
  fontWeight: "400",
}));

const TypographyHeading = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
}));

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const StyledFormControl2 = styled(FormControl)(({ theme }) => ({
  marginBottom: theme.spacing(1),
}));

const StyledCheckbox = styled(Checkbox)(({ theme }) => ({
  paddingTop: "0.25rem",
  paddingBottom: "0.25rem",
}));

const ButtonClear = styled(Button)(({ theme }) => ({
  marginRight: theme.spacing(2),
}));

const ContainerTopPadded = styled("div")(({ theme }) => ({
  paddingTop: theme.spacing(2),
}));

const CircularProgressButton = styled(CircularProgress)(({ theme }) => ({
  position: "absolute",
  top: "50%",
  left: "50%",
  marginTop: -12,
  marginLeft: -12,
}));

class FirSearchView extends React.PureComponent {
  state = {
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
  };

  static propTypes = {
    model: PropTypes.object.isRequired,
    app: PropTypes.object.isRequired,
    localObserver: PropTypes.object.isRequired,
  };

  static defaultProps = {};

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.localObserver = this.props.localObserver;
    this.globalObserver = this.props.app.globalObserver;

    if (this.model.searchTypes.length > 0) {
      this.state.searchTypeId = this.model.searchTypes[0].id;
    }

    this.initListeners();
  }

  initListeners() {
    this.localObserver.subscribe("fir.search.started", () => {
      this.setState({ loading: true });
    });
    this.localObserver.subscribe("fir.search.completed", () => {
      this.setState({ loading: false });
    });
    this.localObserver.subscribe("fir.search.error", () => {
      this.setState({ loading: false });
    });
  }

  handleClearSearch = () => {
    this.localObserver.publish("fir.search.clear", {});
    this.setState({ searchText: "" });
  };

  handleSearch = (overrideOptions = {}) => {
    let options = {
      text: this.state.searchText,
      exactMatch: this.state.exactMatch || false,
      showDesignation: this.state.showDesignation || false,
      showSearchArea: this.state.showSearchArea || false,
      buffer: this.state.buffer || 0,
      searchTypeId: this.state.searchTypeId,
      zoomToLayer: true,
    };

    options = { ...options, ...overrideOptions };

    this.localObserver.publish("fir.search.search", options);
  };

  handleSearchTextChange = (e) => {
    this.setState({
      searchText: e.target.value || "",
    });
    if (e.target.value && e.target.value.length >= 4) {
      // Throttle!
      clearTimeout(this.search_tm);
      this.search_tm = setTimeout(() => {
        this.handleSearch({ zoomToLayer: false });
      }, 500);
    }
  };

  handleMultilinePaste = (text) => {
    const notEmptyFilter = (s) => {
      return s.trim() !== "";
    };
    const texts = text
      .split("\n")
      .filter(notEmptyFilter)
      .map((line) => {
        return line.trim().split("  ")[0];
      })
      .filter(notEmptyFilter)
      .join(", ");

    this.setState({ searchText: texts });
    this.search_tm = setTimeout(() => {
      this.handleSearch({ zoomToLayer: false });
    }, 500);
  };

  handlePaste = (e) => {
    try {
      const cbText = e?.clipboardData?.getData("text").trim();
      if (cbText && cbText.indexOf("\n") > -1) {
        e.preventDefault();
        this.handleMultilinePaste(cbText);
      }
    } catch (error) {
      console.log("Error when pasting: ", error);
    }
  };

  render() {
    return (
      <>
        <Accordion
          expanded={this.state.searchPanelExpanded}
          onChange={() => {
            this.setState({
              searchPanelExpanded: !this.state.searchPanelExpanded,
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
                  value={this.state.searchTypeId}
                  variant="standard"
                  onChange={(e) => {
                    this.setState({ searchTypeId: e.target.value });
                  }}
                >
                  {this.model.searchTypes
                    .filter((item) => {
                      return item.visibleInDropDown !== false;
                    })
                    .map((item, index) => (
                      <MenuItem
                        key={`fir-searchType-${item.id}`}
                        value={item.id}
                      >
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
                  onChange={this.handleSearchTextChange}
                  onKeyPress={(e) => {
                    if (e.key.toLowerCase() === "enter") {
                      this.handleSearch();
                      e.preventDefault();
                    }
                  }}
                  onPaste={this.handlePaste}
                  value={this.state.searchText}
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
                      checked={this.state.exactMatch}
                      onChange={(e) => {
                        this.setState({ exactMatch: e.target.checked });
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
                      checked={this.state.showDesignation}
                      onChange={(e) => {
                        this.setState({ showDesignation: e.target.checked });
                        this.localObserver.publish(
                          "fir.layers.showDesignation",
                          {
                            value: e.target.checked,
                          }
                        );
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
                      checked={this.state.showSearchArea}
                      onChange={(e) => {
                        this.setState({ showSearchArea: e.target.checked });
                        this.localObserver.publish(
                          "fir.layers.showSearchArea",
                          {
                            value: e.target.checked,
                          }
                        );
                      }}
                      color="primary"
                    />
                  }
                  label="Visa buffer/sökområde"
                />
              </StyledFormControl>
            </div>

            <FirToolbarView
              model={this.model}
              app={this.props.app}
              localObserver={this.localObserver}
            />

            <ContainerTopPadded style={{ textAlign: "right" }}>
              <ButtonClear
                variant="outlined"
                color="primary"
                component="span"
                size="small"
                onClick={this.handleClearSearch}
              >
                Rensa
              </ButtonClear>
              <Button
                variant="contained"
                color="primary"
                component="span"
                size="small"
                onClick={this.handleSearch}
                disabled={this.state.loading}
              >
                Sök
                {this.state.loading && <CircularProgressButton size={24} />}
              </Button>
            </ContainerTopPadded>
          </AccordionDetails>
        </Accordion>
      </>
    );
  }
}

export default FirSearchView;
