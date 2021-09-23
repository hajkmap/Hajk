import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import Button from "@material-ui/core/Button";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import SearchIcon from "@material-ui/icons/Search";
import { Typography } from "@material-ui/core";
import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import Select from "@material-ui/core/Select";
import InputLabel from "@material-ui/core/InputLabel";
import Input from "@material-ui/core/Input";

import InputAdornment from "@material-ui/core/InputAdornment";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import CircularProgress from "@material-ui/core/CircularProgress";
import FirToolbarView from "./FirToolbarView";

class FirSearchView extends React.PureComponent {
  state = {
    searchText: "",
    searchPanelExpanded: true,
    neighborExpanded: false,
    searchType: "designation",
    buffer: 0,
    files: { list: [] },
    exactMatch: false,
    showDesignation: true,
    showSearchArea: true,
    loading: false,
  };

  static propTypes = {
    model: PropTypes.object.isRequired,
    app: PropTypes.object.isRequired,
    localObserver: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
  };

  static defaultProps = {};

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.localObserver = this.props.localObserver;
    this.globalObserver = this.props.app.globalObserver;

    this.searchTypes = [
      { value: "designation", name: "Fastighetsbeteckning" },
      { value: "owner", name: "Ägare" },
      { value: "address", name: "Adress" },
    ];

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
    this.localObserver.publish("fir.search.clear", { sender: "FirSearchView" });
    this.setState({ searchText: "" });
  };

  handleSearch = () => {
    this.localObserver.publish("fir.search.search", {
      text: this.state.searchText,
      exactMatch: this.state.exactMatch || false,
      showDesignation: this.state.showDesignation || false,
      showSearchArea: this.state.showSearchArea || false,
      buffer: this.state.buffer || 0,
      searchType: this.state.searchType,
    });
  };

  handleSearchTextChange = (e) => {
    this.setState({
      searchText: e.target.value || "",
    });
  };

  render() {
    const { classes } = this.props;
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
            <Typography className={classes.heading}>Sök fastigheter</Typography>
          </AccordionSummary>
          <AccordionDetails style={{ display: "block" }}>
            <div>
              <FormControl className={classes.formControl} fullWidth={true}>
                <InputLabel id="searchType">Sök på</InputLabel>
                <Select
                  labelId="searchType"
                  value={this.state.searchType}
                  onChange={(e) => {
                    this.setState({ searchType: e.target.value });
                  }}
                >
                  {this.searchTypes.map((item, index) => (
                    <MenuItem
                      key={`fir-searchType-${item.value}`}
                      value={item.value}
                    >
                      {item.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
            <div>
              <FormControl
                className={classes.formControlOneMargin}
                fullWidth={true}
              >
                <Input
                  id="input-with-icon-adornment"
                  placeholder="Söktext"
                  onChange={this.handleSearchTextChange}
                  value={this.state.searchText}
                  startAdornment={
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  }
                />
              </FormControl>
            </div>
            <div>
              <FormControl fullWidth={true}>
                <FormControlLabel
                  classes={{
                    label: classes.checkboxLabel,
                  }}
                  control={
                    <Checkbox
                      className={classes.checkbox}
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
                <FormControlLabel
                  classes={{ label: classes.checkboxLabel }}
                  control={
                    <Checkbox
                      className={classes.checkbox}
                      checked={this.state.showDesignation}
                      onChange={(e) => {
                        this.setState({ showDesignation: e.target.checked });
                        this.localObserver.publish(
                          "fir.layers.showDesignation",
                          { value: e.target.checked }
                        );
                      }}
                      color="primary"
                    />
                  }
                  label="Visa fastighetsbeteckning"
                />
              </FormControl>
              <FormControl className={classes.formControl} fullWidth={true}>
                <FormControlLabel
                  classes={{ label: classes.checkboxLabel }}
                  control={
                    <Checkbox
                      className={classes.checkbox}
                      checked={this.state.showSearchArea}
                      onChange={(e) => {
                        this.setState({ showSearchArea: e.target.checked });
                        this.localObserver.publish(
                          "fir.layers.showSearchArea",
                          { value: e.target.checked }
                        );
                      }}
                      color="primary"
                    />
                  }
                  label="Visa buffer/sökområde"
                />
              </FormControl>
            </div>

            <FirToolbarView
              model={this.model}
              app={this.props.app}
              localObserver={this.localObserver}
            />

            <div
              className={classes.containerTopPadded}
              style={{ textAlign: "right" }}
            >
              <Button
                variant="outlined"
                color="primary"
                component="span"
                size="small"
                onClick={this.handleClearSearch}
                className={classes.clearButton}
              >
                Rensa
              </Button>
              <Button
                variant="contained"
                color="primary"
                component="span"
                size="small"
                onClick={this.handleSearch}
                disabled={this.state.loading}
              >
                Sök
                {this.state.loading && (
                  <CircularProgress
                    size={24}
                    className={classes.buttonProgress}
                  />
                )}
              </Button>
            </div>
          </AccordionDetails>
        </Accordion>
      </>
    );
  }
}

const styles = (theme) => ({
  root: {
    // paddingBottom: theme.spacing(2),
  },
  heading: {
    fontWeight: 500,
  },
  formControl: {
    marginBottom: theme.spacing(3),
  },
  formControlOneMargin: {
    marginBottom: theme.spacing(1),
  },
  checkboxLabel: {
    fontSize: "0.875rem",
    fontWeight: "400",
  },
  checkbox: {
    paddingTop: "0.25rem",
    paddingBottom: "0.25rem",
  },
  subtitle: {
    marginBottom: theme.spacing(1) / 2,
  },
  buttonGroup: {
    width: "100%",
    overflow: "hidden",
    whiteSpace: "nowrap",
  },
  iconButton: {
    margin: theme.spacing(0),
    paddingLeft: 0,
    paddingRight: 0,
    minWidth: "2.875rem",
    width: "calc(99.9% / 6)",
  },
  clearButton: {
    marginRight: theme.spacing(2),
  },
  containerTopPadded: {
    paddingTop: theme.spacing(2),
  },
  containerTopDoublePadded: {
    paddingTop: theme.spacing(4),
  },
  fileInputContainer: {
    display: "flex",
    alignItems: "center",
    "& > *": {
      display: "flex",
    },
    "& span": {
      whiteSpace: "nowrap",
    },
    "& span.filename": {
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      overflow: "hidden",
      display: "block",
      paddingLeft: theme.spacing(1),
      fontWeight: "300",
    },
  },
  fileInput: {
    display: "none",
  },
  svgImg: {
    height: "24px",
    width: "24px",
  },
  buttonContainedPrimary: {
    "& img": {
      filter: "invert(1)", // fixes icon-colors on geometry icons.
    },
  },
  buttonProgress: {
    // color: green[500],
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -12,
    marginLeft: -12,
  },
});

export default withStyles(styles)(withSnackbar(FirSearchView));
