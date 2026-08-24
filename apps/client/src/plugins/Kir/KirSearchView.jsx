import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Typography } from "@mui/material";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import KirToolbarView from "../Fir/FirToolbarView";
import Grid from "@mui/material/Grid";
import Slider from "@mui/material/Slider";

const GridAgeInputContainer = styled(Grid)(({ theme }) => ({
  paddingLeft: theme.spacing(2),
  "& input": {
    paddingRight: "8px",
    paddingLeft: "8px",
  },
}));

const TextFieldInput = styled(TextField)(({ _theme }) => ({
  marginTop: "-4px",
}));

const TypographyHeading = styled(Typography)(({ _theme }) => ({
  fontWeight: 500,
}));

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const StyledFormControlLabel = styled(FormControlLabel)(({ _theme }) => ({
  fontSize: "0.875rem",
  fontWeight: "400",
}));

const StyledCheckbox = styled(Checkbox)(({ _theme }) => ({
  paddingTop: "0.25rem",
  paddingBottom: "0.25rem",
}));

const TypographySubtitleShallow = styled(Typography)(({ theme }) => ({
  marginBottom: -theme.spacing(1) / 2,
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

const StyledSlider = styled(Slider)(({ _theme }) => ({
  marginLeft: "8px",
  width: "calc(100% - 16px)",
}));

function KirSearchView({ model, app, localObserver }) {
  const inputMaxAge = useRef(null);
  const inputMinAge = useRef(null);
  const fnsRef = useRef({});

  const [state, setStateRaw] = useState(() => ({
    searchText: "",
    searchPanelExpanded: true,
    neighborExpanded: false,
    searchType: "",
    buffer: 0,
    files: { list: [] },
    genderMale: true,
    genderFemale: true,
    showDesignation: true,
    showSearchArea: true,
    loading: false,
    ageValues: [0, 120],
    maxAge: 120,
    minInputValue: 0,
    maxInputValue: 120,
  }));
  const stateRef = useRef(state);

  const setState = (patch) => {
    stateRef.current = { ...stateRef.current, ...patch };
    setStateRaw(stateRef.current);
  };

  const handleClearSearch = () => {
    localObserver.publish("kir.search.clear", {});
    setState({
      searchText: "",
      ageValues: [0, 120],
      genderMale: true,
      genderFemale: true,
      showSearchArea: true,
    });
  };

  const handleSearch = () => {
    let options = {
      genderMale: stateRef.current.genderMale || false,
      genderFemale: stateRef.current.genderFemale || false,
      ageLower: stateRef.current.ageValues[0],
      ageUpper: stateRef.current.ageValues[1],
      zoomToLayer: true,
    };

    localObserver.publish("kir.search.search", options);
  };

  const handleAgeChange = (e, newValues) => {
    setState({
      ageValues: newValues,
    });
  };

  const inputMinAgeChanged = (e, _newValue) => {
    setState({
      ageValues: [
        e.target.value === "" ? 120 : parseInt(e.target.value),
        stateRef.current.ageValues[1],
      ],
    });
  };

  const inputMaxAgeChanged = (e, _newValue) => {
    setState({
      ageValues: [
        stateRef.current.ageValues[0],
        e.target.value === "" ? 120 : parseInt(e.target.value),
      ],
    });
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
    localObserver.subscribe("kir.search.started", () => {
      fnsRef.current.handleSearchStarted();
    });
    localObserver.subscribe("kir.search.completed", () => {
      fnsRef.current.handleSearchCompleted();
    });
    localObserver.subscribe("kir.search.error", () => {
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
          <TypographyHeading>Sök invånare</TypographyHeading>
        </AccordionSummary>
        <AccordionDetails style={{ display: "block" }}>
          <StyledFormControl fullWidth={true}>
            <KirToolbarView
              prefix="kir"
              model={model}
              app={app}
              localObserver={localObserver}
            />
          </StyledFormControl>

          <div>
            <StyledFormControl fullWidth={true}>
              <StyledFormControlLabel
                // classes={{ label: classes.checkboxLabel }}
                control={
                  <StyledCheckbox
                    checked={state.showSearchArea}
                    onChange={(e) => {
                      setState({ showSearchArea: e.target.checked });
                      localObserver.publish("kir.layers.showSearchArea", {
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

          <div>
            <FormControl fullWidth={true}>
              <TypographySubtitleShallow variant="subtitle2">
                Inkludera kön:
              </TypographySubtitleShallow>
              <Grid
                container
                spacing={0}
                sx={{
                  alignItems: "center",
                }}
              >
                <StyledFormControlLabel
                  control={
                    <StyledCheckbox
                      checked={state.genderMale}
                      onChange={(e) => {
                        setState({ genderMale: e.target.checked });
                      }}
                      color="primary"
                    />
                  }
                  label="Man"
                />
                <StyledFormControlLabel
                  control={
                    <StyledCheckbox
                      checked={state.genderFemale}
                      onChange={(e) => {
                        setState({ genderFemale: e.target.checked });
                      }}
                      color="primary"
                    />
                  }
                  label="Kvinna"
                />
              </Grid>
            </FormControl>
          </div>

          <ContainerTopPadded>
            <TypographySubtitleShallow variant="subtitle2">
              Ålder (från, till):
            </TypographySubtitleShallow>
            <Grid
              container
              spacing={0}
              sx={{
                alignItems: "center",
              }}
            >
              <Grid size={6}>
                <StyledSlider
                  value={state.ageValues}
                  onChange={handleAgeChange}
                  valueLabelDisplay="off"
                  aria-labelledby="range-slider"
                  step={1}
                  min={0}
                  max={state.maxAge}
                />
              </Grid>
              <GridAgeInputContainer size={3}>
                <TextFieldInput
                  fullWidth
                  size="small"
                  value={state.ageValues[0]}
                  onChange={inputMinAgeChanged}
                  inputRef={inputMinAge}
                  inputProps={{
                    step: 1,
                    min: 0,
                    max: state.maxAge,
                    type: "number",
                  }}
                />
              </GridAgeInputContainer>
              <GridAgeInputContainer size={3}>
                <TextFieldInput
                  fullWidth
                  size="small"
                  value={state.ageValues[1]}
                  onChange={inputMaxAgeChanged}
                  inputRef={inputMaxAge}
                  inputProps={{
                    step: 1,
                    min: 0,
                    max: state.maxAge,
                    type: "number",
                  }}
                />
              </GridAgeInputContainer>
            </Grid>
          </ContainerTopPadded>

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

KirSearchView.propTypes = {
  model: PropTypes.object.isRequired,
  app: PropTypes.object.isRequired,
  localObserver: PropTypes.object.isRequired,
};

export default KirSearchView;
