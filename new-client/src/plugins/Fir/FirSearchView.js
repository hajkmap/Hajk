import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import Button from "@material-ui/core/Button";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import SearchIcon from "@material-ui/icons/Search";
import DeleteIcon from "@material-ui/icons/Delete";
import InsertDriveFileIcon from "@material-ui/icons/InsertDriveFile";
import { Typography } from "@material-ui/core";
import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import Select from "@material-ui/core/Select";
import InputLabel from "@material-ui/core/InputLabel";
import Input from "@material-ui/core/Input";
import TextField from "@material-ui/core/TextField";

import InputAdornment from "@material-ui/core/InputAdornment";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import Collapse from "@material-ui/core/Collapse";
import FirSearchResultsView from "./FirSearchResultsView";

class FirSearchView extends React.PureComponent {
  state = {
    searchPanelExpanded: true,
    neighbourExpanded: false,
    searchType: "Fastighetsbeteckning",
    searchAreaButtons: {
      polygon: { selected: false },
      rectangle: { selected: false },
      line: { selected: false },
      point: { selected: false },
      import: { selected: false },
      delete: { selected: false },
    },
    buffer: 0,
    files: { list: [] },
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
    this.initSearchAreaMethods();
  }

  initSearchAreaMethods() {
    this.searchAreaMethods = {};

    let defaultActivate = (id) => {
      console.log("activate: " + id);
    };
    let defaultDeactivate = (id) => {
      console.log("deactivate: " + id);
    };

    for (let key in this.state.searchAreaButtons) {
      this.searchAreaMethods[key] = {
        activate: defaultActivate,
        deactivate: defaultDeactivate,
      };
    }

    // this.searchAreaMethods.polygon.activate = () => {}
  }

  handleSearchAreaClick(id) {
    let o = { ...this.state.searchAreaButtons };

    for (let key in o) {
      if (key === id) {
        o[key].selected = !o[key].selected;
        let fn = o[key].selected === true ? "activate" : "deactivate";
        this.searchAreaMethods[id][fn](key);
      } else {
        if (o[key].selected === true) {
          o[key].selected = false;
          this.searchAreaMethods[id].deactivate(key);
        }
      }
    }

    this.setState({
      searchAreaButtons: o,
    });
  }

  handleFileSelection = (e) => {
    if (e && e.target) {
      this.setState({ files: { list: e.target.files || [] } });
      if (e.target.files.length > 0) {
        this.localObserver.publish("fir-kml-upload", e.target.files[0]);
      }
    }
  };

  handleClearSearch() {
    console.log("Clear search!");
  }

  handleSearch() {
    console.log("Search!");
  }

  render() {
    const { classes } = this.props;
    return (
      <>
        <div className={classes.root}>
          <Accordion
            expanded={this.state.searchPanelExpanded}
            onChange={() => {
              this.setState({
                searchPanelExpanded: !this.state.searchPanelExpanded,
              });
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography className={classes.heading}>
                Sök fastigheter
              </Typography>
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
                    <MenuItem value="Fastighetsbeteckning">
                      Fastighetsbeteckning
                    </MenuItem>
                    <MenuItem value="Ägare">Ägare</MenuItem>
                    <MenuItem value="Adress">Adress</MenuItem>
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
                        //checked={state.checkedA}
                        //onChange={handleChange}
                        color="secondary"
                        name="checkedA"
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
                        //checked={state.checkedA}
                        //onChange={handleChange}
                        color="secondary"
                        name="checkedA"
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
                        //checked={state.checkedA}
                        //onChange={handleChange}
                        color="secondary"
                        name="checkedA"
                      />
                    }
                    label="Visa buffer/sökområde"
                  />
                </FormControl>
              </div>
              <div>
                <Typography variant="subtitle2" className={classes.subtitle}>
                  Sökområde
                </Typography>
                <ButtonGroup
                  // color="primary"
                  className={classes.buttonGroup}
                  variant="contained"
                  aria-label="outlined button group"
                >
                  <Button
                    title="Polygon"
                    className={classes.iconButton}
                    classes={{
                      containedPrimary: classes.buttonContainedPrimary,
                    }}
                    color={
                      this.state.searchAreaButtons.polygon.selected
                        ? "primary"
                        : null
                    }
                    onClick={() => {
                      this.handleSearchAreaClick("polygon");
                    }}
                  >
                    <img
                      src="/g-polygon.svg"
                      className={classes.svgImg}
                      alt=""
                    />
                  </Button>
                  <Button
                    title="Rektangel"
                    className={classes.iconButton}
                    classes={{
                      containedPrimary: classes.buttonContainedPrimary,
                    }}
                    color={
                      this.state.searchAreaButtons.rectangle.selected
                        ? "primary"
                        : null
                    }
                    onClick={() => {
                      this.handleSearchAreaClick("rectangle");
                    }}
                  >
                    <img src="/g-rect.svg" className={classes.svgImg} alt="" />
                  </Button>
                  <Button
                    title="Linje"
                    className={classes.iconButton}
                    classes={{
                      containedPrimary: classes.buttonContainedPrimary,
                    }}
                    color={
                      this.state.searchAreaButtons.line.selected
                        ? "primary"
                        : null
                    }
                    onClick={() => {
                      this.handleSearchAreaClick("line");
                    }}
                  >
                    <img src="/g-line.svg" className={classes.svgImg} alt="" />
                  </Button>
                  <Button
                    title="Punkt"
                    className={classes.iconButton}
                    classes={{
                      containedPrimary: classes.buttonContainedPrimary,
                    }}
                    color={
                      this.state.searchAreaButtons.point.selected
                        ? "primary"
                        : null
                    }
                    onClick={() => {
                      this.handleSearchAreaClick("point");
                    }}
                  >
                    <img src="/g-point.svg" className={classes.svgImg} alt="" />
                  </Button>
                  <Button
                    title="Importera KLM-fil"
                    className={classes.iconButton}
                    color={
                      this.state.searchAreaButtons.import.selected
                        ? "primary"
                        : null
                    }
                    onClick={() => {
                      this.handleSearchAreaClick("import");
                    }}
                  >
                    <InsertDriveFileIcon />
                  </Button>
                  <Button
                    title="Ta bort objekt"
                    className={classes.iconButton}
                    color={
                      this.state.searchAreaButtons.delete.selected
                        ? "primary"
                        : null
                    }
                    onClick={() => {
                      this.handleSearchAreaClick("delete");
                    }}
                  >
                    <DeleteIcon />
                  </Button>
                </ButtonGroup>
                <Collapse
                  in={this.state.searchAreaButtons.import.selected === true}
                >
                  <div className={classes.containerTopPadded}>
                    <Typography
                      variant="subtitle2"
                      className={classes.subtitle}
                    >
                      Importera KML-fil
                    </Typography>
                    <div className={classes.fileInputContainer}>
                      <input
                        accept=".kml"
                        className={classes.fileInput}
                        id="firFileInput"
                        type="file"
                        onChange={this.handleFileSelection}
                      />
                      <label htmlFor="firFileInput">
                        <Button
                          variant="contained"
                          color="secondary"
                          component="span"
                          size="small"
                        >
                          Välj fil
                        </Button>
                      </label>
                      <span className="filename">
                        {this.state.files.list.length > 0
                          ? this.state.files.list[0].name
                          : "Ingen fil är vald"}
                      </span>
                    </div>
                  </div>
                </Collapse>
              </div>
              <div className={classes.containerTopDoublePadded}>
                <TextField
                  fullWidth={true}
                  label="Lägg till buffer på sökområde"
                  value={this.state.buffer}
                  onChange={(e) => {
                    let v = parseInt(e.target.value);
                    if (isNaN(v)) {
                      v = 0;
                    }

                    this.setState({ buffer: parseInt(v) });
                  }}
                  onFocus={(e) => {
                    if (this.state.buffer === 0) {
                      this.setState({ buffer: "" });
                    }
                  }}
                  onBlur={(e) => {
                    if (this.state.buffer === "") {
                      this.setState({ buffer: 0 });
                    }
                  }}
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">meter</InputAdornment>
                    ),
                  }}
                  variant="outlined"
                />
              </div>
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
                >
                  Sök
                </Button>
              </div>
            </AccordionDetails>
          </Accordion>

          <FirSearchResultsView
            model={this.props.model}
            app={this.props.app}
            localObserver={this.localObserver}
          />
        </div>
      </>
    );
  }
}

const styles = (theme) => ({
  root: {
    paddingBottom: theme.spacing(2),
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
    fontWeight: "300",
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
});

export default withStyles(styles)(withSnackbar(FirSearchView));
