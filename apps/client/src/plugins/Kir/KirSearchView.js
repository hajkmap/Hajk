import React from "react";
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

const TextFieldInput = styled(TextField)(({ theme }) => ({
  marginTop: "-4px",
}));

const TypographyHeading = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
}));

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const StyledFormControlLabel = styled(FormControlLabel)(({ theme }) => ({
  fontSize: "0.875rem",
  fontWeight: "400",
}));

const StyledCheckbox = styled(Checkbox)(({ theme }) => ({
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

const CircularProgressButton = styled(CircularProgress)(({ theme }) => ({
  position: "absolute",
  top: "50%",
  left: "50%",
  marginTop: -12,
  marginLeft: -12,
}));

const StyledSlider = styled(Slider)(({ theme }) => ({
  marginLeft: "8px",
  width: "calc(100% - 16px)",
}));

class KirSearchView extends React.PureComponent {
  state = {
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

    this.inputMaxAge = React.createRef();
    this.inputMinAge = React.createRef();

    this.initListeners();
  }

  initListeners() {
    this.localObserver.subscribe("kir.search.started", () => {
      this.setState({ loading: true });
    });
    this.localObserver.subscribe("kir.search.completed", () => {
      this.setState({ loading: false });
    });
    this.localObserver.subscribe("kir.search.error", () => {
      this.setState({ loading: false });
    });
  }

  handleClearSearch = () => {
    this.localObserver.publish("kir.search.clear", {});
    this.setState({
      searchText: "",
      ageValues: [0, 120],
      genderMale: true,
      genderFemale: true,
      showSearchArea: true,
    });
  };

  handleSearch = () => {
    let options = {
      genderMale: this.state.genderMale || false,
      genderFemale: this.state.genderFemale || false,
      ageLower: this.state.ageValues[0],
      ageUpper: this.state.ageValues[1],
      zoomToLayer: true,
    };

    this.localObserver.publish("kir.search.search", options);
  };

  handleAgeChange = (e, newValues) => {
    this.setState({
      ageValues: newValues,
    });
  };

  inputMinAgeChanged = (e, newValue) => {
    this.setState({
      ageValues: [
        e.target.value === "" ? 120 : parseInt(e.target.value),
        this.state.ageValues[1],
      ],
    });
  };

  inputMaxAgeChanged = (e, newValue) => {
    this.setState({
      ageValues: [
        this.state.ageValues[0],
        e.target.value === "" ? 120 : parseInt(e.target.value),
      ],
    });
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
            <TypographyHeading>Sök invånare</TypographyHeading>
          </AccordionSummary>
          <AccordionDetails style={{ display: "block" }}>
            <StyledFormControl fullWidth={true}>
              <KirToolbarView
                prefix="kir"
                model={this.model}
                app={this.props.app}
                localObserver={this.localObserver}
              />
            </StyledFormControl>

            <div>
              <StyledFormControl fullWidth={true}>
                <StyledFormControlLabel
                  // classes={{ label: classes.checkboxLabel }}
                  control={
                    <StyledCheckbox
                      checked={this.state.showSearchArea}
                      onChange={(e) => {
                        this.setState({ showSearchArea: e.target.checked });
                        this.localObserver.publish(
                          "kir.layers.showSearchArea",
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

            <div>
              <FormControl fullWidth={true}>
                <TypographySubtitleShallow variant="subtitle2">
                  Inkludera kön:
                </TypographySubtitleShallow>
                <Grid container spacing={0} alignItems="center">
                  <StyledFormControlLabel
                    control={
                      <StyledCheckbox
                        checked={this.state.genderMale}
                        onChange={(e) => {
                          this.setState({ genderMale: e.target.checked });
                        }}
                        color="primary"
                      />
                    }
                    label="Man"
                  />
                  <StyledFormControlLabel
                    control={
                      <StyledCheckbox
                        checked={this.state.genderFemale}
                        onChange={(e) => {
                          this.setState({ genderFemale: e.target.checked });
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
              <Grid container spacing={0} alignItems="center">
                <Grid item xs={6}>
                  <StyledSlider
                    value={this.state.ageValues}
                    onChange={this.handleAgeChange}
                    valueLabelDisplay="off"
                    aria-labelledby="range-slider"
                    step={1}
                    min={0}
                    max={this.state.maxAge}
                  />
                </Grid>
                <GridAgeInputContainer item xs={3}>
                  <TextFieldInput
                    fullWidth
                    size="small"
                    value={this.state.ageValues[0]}
                    onChange={this.inputMinAgeChanged}
                    inputRef={this.inputMinAge}
                    inputProps={{
                      step: 1,
                      min: 0,
                      max: this.state.maxAge,
                      type: "number",
                    }}
                  />
                </GridAgeInputContainer>
                <GridAgeInputContainer item xs={3}>
                  <TextFieldInput
                    fullWidth
                    size="small"
                    value={this.state.ageValues[1]}
                    onChange={this.inputMaxAgeChanged}
                    inputRef={this.inputMaxAge}
                    inputProps={{
                      step: 1,
                      min: 0,
                      max: this.state.maxAge,
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

export default KirSearchView;
