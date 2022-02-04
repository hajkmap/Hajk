import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import FormControl from "@material-ui/core/FormControl";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Radio from "@material-ui/core/Radio";
import Slider from "@material-ui/core/Slider";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";
import Collapse from "@material-ui/core/Collapse";
import Button from "@material-ui/core/Button";
import Feature from "ol/Feature.js";
import {
  Point,
  LineString,
  Polygon,
  MultiPoint,
  MultiLineString,
  MultiPolygon,
  LinearRing,
} from "ol/geom.js";

import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import HistoryIcon from "@material-ui/icons/History";
import { Typography } from "@material-ui/core";
import CircularProgress from "@material-ui/core/CircularProgress";
// import * as jsts from "jsts";
// FIXME: Temporary fix for "Module not found: Can't resolve 'jsts'"
const jsts = {};

const styles = (theme) => ({
  heading: {
    fontWeight: 500,
  },
  radio: {
    paddingTop: "0.25rem",
    paddingBottom: "0.25rem",
  },
  radioLabel: {
    fontSize: "0.875rem",
    fontWeight: "400",
  },
  containerTopPadded: {
    paddingTop: theme.spacing(2),
  },
  containerTopDoublePadded: {
    paddingTop: theme.spacing(4),
  },
  clearButton: {
    marginRight: theme.spacing(2),
  },
  sliderContainer: {
    display: "flex",
    paddingRight: theme.spacing(1),
    alignItems: "center",
    "& > div:first-child": {
      flex: "0 0 35%",
      marginRight: theme.spacing(2),
    },
  },
  buttonProgress: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -12,
    marginLeft: -12,
  },
});
class FirSearchNeighborView extends React.PureComponent {
  state = {
    accordionExpanded: false,
    radioValue: "delimiting",
    buffer: 50,
    results: [],
    resultHistory: [],
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
    this.update_tm = null;

    this.localObserver.subscribe(
      "fir.results.filtered",
      this.handleDataRefresh
    );
  }

  handleDataRefresh = (list) => {
    clearTimeout(this.update_tm);
    const _list = list;
    this.update_tm = setTimeout(() => {
      this.setState({ results: _list });
      if (_list.length === 0) {
        this.setState({ accordionExpanded: false });
      }
      this.setState({ loading: false });
      this.forceUpdate();
    }, 500);
  };

  handleRadioChange = (e) => {
    this.setState({ radioValue: e.target.value });
  };

  handleHistoryBack = () => {
    if (this.state.resultHistory.length === 0) {
      return;
    }

    this.setState({ loading: true });

    this.props.model.layers.buffer.getSource().clear();
    // Now we need to get previous results and publish to ResultView etc.
    this.localObserver.publish(
      "fir.search.load",
      this.state.resultHistory.pop()
    );
  };

  #handleSearch = () => {
    const parser = new jsts.io.OL3Parser();
    parser.inject(
      Point,
      LineString,
      LinearRing,
      Polygon,
      MultiPoint,
      MultiLineString,
      MultiPolygon
    );
    const buffer = new Feature();
    let bufferGeom = null;
    let jstsGeom = null;
    let buffered = null;
    let bufferValue =
      this.state.radioValue === "delimiting" ? 0.01 : this.state.buffer;

    this.state.resultHistory.push(this.state.results);

    this.state.results.forEach((feature) => {
      jstsGeom = parser.read(feature.getGeometry());
      buffered = jstsGeom.buffer(bufferValue);
      bufferGeom = !bufferGeom ? buffered : bufferGeom.union(buffered);
    });

    if (bufferGeom) {
      buffer.set("fir_type", "buffer");
      buffer.set("fir_origin", "neighbor");
      buffer.setGeometry(parser.write(bufferGeom));
      this.props.model.layers.buffer.getSource().clear();
      this.props.model.layers.buffer.getSource().addFeature(buffer);
    }

    let options = {
      text: "",
      searchTypeId: this.model.config.wfsRealEstateLayer.id,
      zoomToLayer: true,
      keepNeighborBuffer: true,
    };

    this.localObserver.publish("fir.search.search", options);
  };

  handleSearch = () => {
    this.setState({ loading: true });
    clearTimeout(this.buffer_tm);
    this.buffer_tm = setTimeout(() => {
      this.#handleSearch();
    }, 25);
  };

  render() {
    const { classes } = this.props;

    return (
      <>
        <Accordion
          disabled={this.state.results.length === 0}
          expanded={
            this.state.accordionExpanded && this.state.results.length > 0
          }
          onChange={() => {
            this.setState({
              accordionExpanded: !this.state.accordionExpanded,
            });
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography className={classes.heading}>Hitta grannar</Typography>
          </AccordionSummary>
          <AccordionDetails style={{ display: "block" }}>
            <FormControl fullWidth={true}>
              <RadioGroup
                aria-label="search-type"
                name="searchType"
                value={this.state.radioValue}
                onChange={this.handleRadioChange}
              >
                <FormControlLabel
                  classes={{
                    label: classes.radioLabel,
                  }}
                  value="delimiting"
                  control={<Radio className={classes.radio} color="primary" />}
                  label="Hitta angränsade grannar"
                />
                <FormControlLabel
                  classes={{
                    label: classes.radioLabel,
                  }}
                  value="radius"
                  control={<Radio className={classes.radio} color="primary" />}
                  label="Hitta grannar inom X meter"
                />
              </RadioGroup>
            </FormControl>
            <Collapse in={this.state.radioValue === "radius"}>
              <div className={classes.containerTopPadded}>
                <div className={classes.sliderContainer}>
                  <TextField
                    fullWidth={true}
                    label="Buffer"
                    value={this.state.buffer}
                    onKeyDown={(e) => {
                      return !isNaN(e.key);
                    }}
                    onChange={(e) => {
                      let v = parseInt(e.target.value);
                      if (isNaN(v)) {
                        v = 0;
                      }
                      if (v > 100) {
                        v = 100;
                      }
                      this.setState({ buffer: v });
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
                  <Slider
                    value={
                      isNaN(this.state.buffer) ||
                      parseInt(this.state.buffer) === 0
                        ? 1
                        : this.state.buffer || 1
                    }
                    onChange={(e, v) => {
                      this.setState({ buffer: v });
                    }}
                    step={1}
                    min={1}
                    max={100}
                  />
                </div>
              </div>
            </Collapse>
            <div
              className={classes.containerTopPadded}
              style={{ textAlign: "right" }}
            >
              <Button
                disabled={this.state.resultHistory.length === 0}
                variant="outlined"
                color="primary"
                component="span"
                size="small"
                onClick={this.handleHistoryBack}
                className={classes.clearButton}
                startIcon={<HistoryIcon />}
              >
                Bakåt
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

export default withStyles(styles)(withSnackbar(FirSearchNeighborView));
