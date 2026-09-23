import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { styled } from "@mui/material/styles";
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
import Feature from "ol/Feature";
import HajkTransformer from "../../utils/HajkTransformer";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HistoryIcon from "@mui/icons-material/History";
import { Typography } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import FirStyles from "./FirStyles";

const TypographyHeading = styled(Typography)(({ _theme }) => ({
  fontWeight: 500,
}));

const StyledRadio = styled(Radio)(({ _theme }) => ({
  paddingTop: "0.25rem",
  paddingBottom: "0.25rem",
}));

const StyledFormControlLabel = styled(FormControlLabel)(({ _theme }) => ({
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

const CircularProgressButton = styled(CircularProgress)(({ _theme }) => ({
  position: "absolute",
  top: "50%",
  left: "50%",
  marginTop: -12,
  marginLeft: -12,
}));

function FirSearchNeighborView({ model, localObserver }) {
  const updateTm = useRef(null);
  const bufferTm = useRef(null);
  const fnsRef = useRef({});

  useState(() => new FirStyles(model));

  const [HT] = useState(() => {
    return new HajkTransformer({
      projection: model.app.map.getView().getProjection().getCode(),
    });
  });

  const [state, setStateRaw] = useState(() => ({
    accordionExpanded: false,
    radioValue: "delimiting",
    buffer: 50,
    results: [],
    resultHistory: [],
    loading: false,
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

  const handleDataRefresh = (list) => {
    clearTimeout(updateTm.current);
    const _list = list;
    updateTm.current = setTimeout(() => {
      setState({ results: _list });
      if (_list.length === 0) {
        setState({ accordionExpanded: false });
      }
      setState({ loading: false });
      forceUpdate();
    }, 500);
  };

  const handleRadioChange = (e) => {
    setState({ radioValue: e.target.value });
  };

  const handleHistoryBack = () => {
    if (stateRef.current.resultHistory.length === 0) {
      return;
    }

    setState({ loading: true });

    model.layers.buffer.getSource().clear();

    // Now we need to get previous results and publish to ResultView etc.
    localObserver.publish(
      "fir.search.load",
      stateRef.current.resultHistory.pop()
    );
  };

  const handleNeighborSearch = () => {
    const buffer = new Feature();
    let unionFeature = null;
    let buffered = null;
    let bufferValue =
      stateRef.current.radioValue === "delimiting"
        ? 0.01
        : stateRef.current.buffer;

    stateRef.current.resultHistory.push(stateRef.current.results);

    stateRef.current.results.forEach((feature) => {
      buffered = HT.getBuffered(feature, bufferValue);
      unionFeature = !unionFeature
        ? buffered
        : HT.getUnion(buffered, unionFeature);
    });

    if (unionFeature) {
      buffer.set("fir_type", "buffer");
      buffer.set("fir_origin", "neighbor");
      buffer.setGeometry(unionFeature.getGeometry());
      model.layers.buffer.getSource().clear();
      model.layers.buffer.getSource().addFeature(buffer);
    }

    let options = {
      text: "",
      searchTypeId: model.config.wfsRealEstateLayer.id,
      zoomToLayer: true,
      keepNeighborBuffer: true,
    };

    localObserver.publish("fir.search.search", options);
  };

  const handleSearch = () => {
    setState({ loading: true });
    clearTimeout(bufferTm.current);
    bufferTm.current = setTimeout(() => {
      handleNeighborSearch();
    }, 25);
  };

  fnsRef.current = {
    handleDataRefresh,
  };

  useEffect(() => {
    localObserver.subscribe("fir.results.filtered", (list) => {
      fnsRef.current.handleDataRefresh(list);
    });
  }, [localObserver, fnsRef]);

  return (
    <>
      <Accordion
        disabled={state.results.length === 0}
        expanded={state.accordionExpanded && state.results.length > 0}
        onChange={() => {
          setState({
            accordionExpanded: !state.accordionExpanded,
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
              value={state.radioValue}
              onChange={handleRadioChange}
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
          <Collapse in={state.radioValue === "radius"}>
            <ContainerTopPadded>
              <SliderContainer>
                <TextField
                  fullWidth={true}
                  label="Buffer"
                  value={state.buffer}
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
                    setState({ buffer: v });
                  }}
                  onFocus={(_e) => {
                    if (stateRef.current.buffer === 0) {
                      setState({ buffer: "" });
                    }
                  }}
                  onBlur={(_e) => {
                    if (stateRef.current.buffer === "") {
                      setState({ buffer: 0 });
                    }
                  }}
                  size="small"
                  variant="outlined"
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">meter</InputAdornment>
                      ),
                    },
                  }}
                />
                <Slider
                  value={
                    isNaN(state.buffer) || parseInt(state.buffer) === 0
                      ? 1
                      : state.buffer || 1
                  }
                  onChange={(e, v) => {
                    setState({ buffer: v });
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
              disabled={state.resultHistory.length === 0}
              variant="outlined"
              color="primary"
              component="span"
              size="small"
              onClick={handleHistoryBack}
              startIcon={<HistoryIcon />}
            >
              Bakåt
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

FirSearchNeighborView.propTypes = {
  model: PropTypes.object.isRequired,
  app: PropTypes.object.isRequired,
  localObserver: PropTypes.object.isRequired,
};

export default FirSearchNeighborView;
