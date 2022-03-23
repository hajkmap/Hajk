import React from "react";
import PropTypes from "prop-types";
import { styled } from "@mui/material/styles";

import { withSnackbar } from "notistack";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import FormControl from "@mui/material/FormControl";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import Slider from "@mui/material/Slider";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Collapse from "@mui/material/Collapse";
import Button from "@mui/material/Button";
import Feature from "ol/Feature.js";
import HajkTransformer from "utils/HajkTransformer";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HistoryIcon from "@mui/icons-material/History";
import { Typography } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";

// const styles = (theme) => ({
//   heading: {
//     fontWeight: 500,
//   },
//   radio: {
//     paddingTop: "0.25rem",
//     paddingBottom: "0.25rem",
//   },
//   radioLabel: {
//     fontSize: "0.875rem",
//     fontWeight: "400",
//   },
//   containerTopPadded: {
//     paddingTop: theme.spacing(2),
//   },
//   containerTopDoublePadded: {
//     paddingTop: theme.spacing(4),
//   },
//   clearButton: {
//     marginRight: theme.spacing(2),
//   },
//   sliderContainer: {
//     display: "flex",
//     paddingRight: theme.spacing(1),
//     alignItems: "center",
//     "& > div:first-child": {
//       flex: "0 0 35%",
//       marginRight: theme.spacing(2),
//     },
//   },
//   buttonProgress: {
//     position: "absolute",
//     top: "50%",
//     left: "50%",
//     marginTop: -12,
//     marginLeft: -12,
//   },
// });
const TypographyHeading = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
}));

const StyledRadio = styled(Radio)(({ theme }) => ({
  paddingTop: "0.25rem",
  paddingBottom: "0.25rem",
}));

const StyledFormControlLabel = styled(FormControlLabel)(({ theme }) => ({
  fontSize: "0.875rem",
  fontWeight: "400",
}));

const ContainerTopPadded = styled("div")(({ theme }) => ({
  paddingTop: theme.spacing(2),
}));

const ButtonClear = styled(Button)(({ theme }) => ({
  marginRight: theme.spacing(2),
}));

const SliderContainer = styled("div")(({ theme }) => ({
  display: "flex",
  paddingRight: theme.spacing(1),
  alignItems: "center",

  "& > div:first-of-type": {
    flex: "0 0 35%",
    marginRight: theme.spacing(2),
  },
}));

const CircularProgressButton = styled(CircularProgress)(({ theme }) => ({
  position: "absolute",
  top: "50%",
  left: "50%",
  marginTop: -12,
  marginLeft: -12,
}));

class FirSearchNeighborView extends React.PureComponent {
  #HT;

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
  };

  static defaultProps = {};

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.localObserver = this.props.localObserver;
    this.globalObserver = this.props.app.globalObserver;
    this.update_tm = null;

    this.#HT = new HajkTransformer({
      projection: this.model.app.map.getView().getProjection().getCode(),
    });

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
    const buffer = new Feature();
    let unionFeature = null;
    let buffered = null;
    let bufferValue =
      this.state.radioValue === "delimiting" ? 0.01 : this.state.buffer;

    this.state.resultHistory.push(this.state.results);

    this.state.results.forEach((feature) => {
      buffered = this.#HT.getBuffered(feature, bufferValue);
      unionFeature = !unionFeature
        ? buffered
        : this.#HT.getUnion(buffered, unionFeature);
    });

    if (unionFeature) {
      buffer.set("fir_type", "buffer");
      buffer.set("fir_origin", "neighbor");
      buffer.setGeometry(unionFeature.getGeometry());
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
            <TypographyHeading>Hitta grannar</TypographyHeading>
          </AccordionSummary>
          <AccordionDetails style={{ display: "block" }}>
            <FormControl fullWidth={true}>
              <RadioGroup
                aria-label="search-type"
                name="searchType"
                value={this.state.radioValue}
                onChange={this.handleRadioChange}
              >
                <StyledFormControlLabel
                  value="delimiting"
                  control={<StyledRadio color="primary" />}
                  label="Hitta angränsade grannar"
                />
                <StyledFormControlLabel
                  value="radius"
                  control={<StyledRadio color="primary" />}
                  label="Hitta grannar inom X meter"
                />
              </RadioGroup>
            </FormControl>
            <Collapse in={this.state.radioValue === "radius"}>
              <ContainerTopPadded>
                <SliderContainer>
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
                </SliderContainer>
              </ContainerTopPadded>
            </Collapse>
            <ContainerTopPadded style={{ textAlign: "right" }}>
              <ButtonClear
                disabled={this.state.resultHistory.length === 0}
                variant="outlined"
                color="primary"
                component="span"
                size="small"
                onClick={this.handleHistoryBack}
                startIcon={<HistoryIcon />}
              >
                Bakåt
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

export default withSnackbar(FirSearchNeighborView);
