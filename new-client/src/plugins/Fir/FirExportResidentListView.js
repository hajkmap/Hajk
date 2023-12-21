import React from "react";
import { IconExcel } from "./FirIcons";
import PropTypes from "prop-types";
import { styled } from "@mui/material/styles";
import { withSnackbar } from "notistack";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import { Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Collapse from "@mui/material/Collapse";
import CircularProgress from "@mui/material/CircularProgress";
import DownloadIcon from "@mui/icons-material/GetApp";
import { WFS, GeoJSON } from "ol/format";
import {
  or as orFilter,
  intersects as intersectsFilter,
} from "ol/format/filter";
import { hfetch } from "../../utils/FetchWrapper";

const TypographyHeading = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
}));

const StyledCheckbox = styled(Checkbox)(({ theme }) => ({
  paddingTop: "0.25rem",
  paddingBottom: "0.25rem",
}));

const CheckboxGroupContainer = styled("div")(({ theme }) => ({
  paddingBottom: theme.spacing(2),
}));

const ContainerTopPadded = styled("div")(({ theme }) => ({
  paddingTop: theme.spacing(2),
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  width: "50%",
}));

const DownloadContainer = styled("div")(({ theme }) => ({
  paddingTop: theme.spacing(2),
}));

const CircularProgressButton = styled(CircularProgress)(({ theme }) => ({
  position: "absolute",
  top: "50%",
  left: "50%",
  marginTop: -12,
  marginLeft: -12,
}));

const StyledFormControlLabel = styled(FormControlLabel)(({ theme }) => ({
  fontSize: "0.875rem",
  fontWeight: "400",
}));

const ButtonWithLoader = styled(Button)(({ theme, loading }) => ({
  "& img": {
    opacity: loading === "true" ? 0.3 : 1.0,
  },
}));

class FirExportResidentListView extends React.PureComponent {
  state = {
    accordionExpanded: false,
    chAge: false,
    chBirthdate: false,
    chSsn: false,
    chGender: false,
    chAdjustToReal: false,
    age: 18,
    loading: false,
    downloadUrl: null,
    results: [],
  };

  static propTypes = {
    results: PropTypes.array.isRequired,
    model: PropTypes.object.isRequired,
    localObserver: PropTypes.object.isRequired,
    type: PropTypes.string,
  };

  static defaultProps = {};

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.type = this.props.type ?? "fir"; // kir or fir
    this.localObserver = this.props.localObserver;
    this.options = this.model.app.plugins[this.type].options;

    this.localObserver.subscribe(`${this.type}.results.filtered`, (list) => {
      this.setState({ results: [...list] });
      this.forceUpdate();
    });
  }

  componentDidMount() {
    if (this.type === "kir") {
      // Kir only have one item in accordion, expand it automatically.
      this.setState({ accordionExpanded: true });
    }
  }

  getGeometryFilters(features) {
    let filters = [];
    features.forEach((feature) => {
      filters.push(
        intersectsFilter(
          this.options.wfsRealEstateLayer.geometryField,
          feature.getGeometry()
        )
      );
    });

    return filters.length === 0 ? null : filters;
  }

  getFiltersForStringAndGeometrySearch(params) {
    let rootFilter = null;

    if (params.features.length > 0) {
      rootFilter = this.getGeometryFilters(params.features);
    }

    if (rootFilter && rootFilter.length >= 2) {
      // wrap when more than 1
      rootFilter = orFilter(...rootFilter);
    } else if (rootFilter && rootFilter.length === 1) {
      rootFilter = rootFilter[0];
    }

    return rootFilter;
  }

  getFeatureRequestObject(params) {
    let rootFilter = this.getFiltersForStringAndGeometrySearch(params);

    return {
      srsName: this.model.config.srsName,
      featureNS: "https://www.opengis.net",
      outputFormat: "application/json",
      maxFeatures: this.options.maxFeatures,
      featureTypes: [params.featureType],
      filter: rootFilter,
    };
  }

  getRequestXml(params) {
    const featureRequestObject = this.getFeatureRequestObject(params);
    const featureRequest = new WFS().writeGetFeature(featureRequestObject);
    return new XMLSerializer().serializeToString(featureRequest);
  }

  getResidentExportData = (features) => {
    const mappings = this.options.residentList.mappings;

    features = features.filter((feature) => {
      return feature.get(mappings.ageFieldName) >= this.state.age || 0;
    });

    let columns = [];
    let rows = [];

    // create columns

    if (this.state.chAdjustToReal) {
      columns.push(" ");
    }

    if (this.state.chSsn === true) {
      columns.push(mappings.ssnDisplayName);
    }

    columns.push(mappings.nameDisplayName);

    if (this.state.chAdjustToReal) {
      columns.push("I egenskap av");
      columns.push("  ");
    }

    columns.push(mappings.addressDisplayName);
    columns.push(mappings.postalCodeDisplayName);
    columns.push(mappings.cityDisplayName);

    if (this.state.chAge) {
      columns.push(mappings.ageDisplayName);
    }

    if (this.state.chBirthdate) {
      columns.push(mappings.birthDateDisplayName);
    }

    if (this.state.chGender) {
      columns.push(mappings.genderDisplayName);
    }

    function getValue(feature, key) {
      return feature.get(key);
    }

    // create rows

    features.forEach((f) => {
      let row = [];

      if (this.state.chAdjustToReal) {
        row.push(" ");
      }

      if (this.state.chSsn === true) {
        row.push(this.formatSSN(getValue(f, mappings.ssnFieldName)));
      }

      row.push(getValue(f, mappings.nameFieldName));

      if (this.state.chAdjustToReal) {
        row.push("Boende");
        row.push("  ");
      }

      row.push(getValue(f, mappings.addressFieldName));
      row.push(getValue(f, mappings.postalCodeFieldName));
      row.push(getValue(f, mappings.cityFieldName));

      if (this.state.chAge) {
        row.push(getValue(f, mappings.ageFieldName));
      }

      if (this.state.chBirthdate) {
        row.push(
          this.formatBirthDate(getValue(f, mappings.birthDateFieldName))
        );
      }

      if (this.state.chGender) {
        row.push(getValue(f, mappings.genderFieldName));
      }

      rows.push(row);
    });

    const objectToSend = {
      columns: columns,
      rows: rows,
    };

    return objectToSend;
  };

  sendResidentData = (features) => {
    const data = this.getResidentExportData(features);

    let searchParams = new URLSearchParams();
    searchParams.append("json", JSON.stringify(data));

    hfetch(this.options.residentList.excelExportUrl, {
      method: "post",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      body: searchParams,
    })
      .then((response) => {
        // url just comes as a simple body response, get it.
        return response ? response.text() : null;
      })
      .then((text) => {
        if (text) {
          this.setState({ loading: false });
          this.setState({ downloadUrl: text });
        }
      })
      .catch((err, a) => {
        this.setState({ loading: false });
        this.setState({ downloadUrl: null });
        this.props.closeSnackbar(this.snackBar);
        this.snackBar = this.props.enqueueSnackbar(
          "Ett fel inträffade vid exporten av boendeförteckningen.",
          {
            variant: "error",
          }
        );
      });
  };

  getResidentData = () => {
    let searchType = this.model.getWfsById(this.options.residentList.id);
    let params = {
      featureType: searchType.layers[0],
      url: searchType.url,
      searchProp: searchType.geometryField,
      features: this.props.results,
    };

    const requestXml = this.getRequestXml(params);

    hfetch(params.url, {
      method: "POST",
      body: requestXml,
    })
      .then((response) => {
        return response ? response.json() : null;
      })
      .then((data) => {
        if (data.features?.length > 0) {
          this.sendResidentData(new GeoJSON().readFeatures(data));
        } else {
          this.setState({ loading: false });
          this.props.closeSnackbar(this.snackBar);
          this.snackBar = this.props.enqueueSnackbar(
            "Kunde ej hitta några boende att exportera.",
            {
              variant: "warning",
            }
          );
        }
      })
      .catch((err) => {
        this.setState({ loading: false });
        this.props.closeSnackbar(this.snackBar);
        this.snackBar = this.props.enqueueSnackbar(
          "Ett fel inträffade vid exporten.",
          {
            variant: "error",
          }
        );
      });
  };

  handleSendClick = () => {
    this.setState({ loading: true });
    this.setState({ downloadUrl: null });
    // detach
    setTimeout(() => {
      if (this.props.type === "kir") {
        // In KIR we already have the data so we just send it.
        this.sendResidentData(this.state.results);
      } else {
        this.getResidentData();
      }
    }, 25);
  };

  ExcelLogo() {
    return (
      <img src={IconExcel()} alt="" style={{ width: "24px", height: "auto" }} />
    );
  }

  formatSSN = (ssn) => {
    ssn = "" + ssn;
    let _ssn = ssn.substring(0, ssn.length - 4);
    _ssn += "-" + ssn.substr(ssn.length - 4, 4);
    return _ssn;
  };

  formatBirthDate = (birthDate) => {
    return birthDate.substring(0, birthDate.length - 4);
  };

  render() {
    return (
      <>
        <Accordion
          disabled={
            this.props.results.length === 0 || !this.options.residentList
          }
          expanded={
            this.state.accordionExpanded &&
            this.props.results.length > 0 &&
            this.options.residentList
          }
          onChange={() => {
            this.setState({
              accordionExpanded: !this.state.accordionExpanded,
            });
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <TypographyHeading>Boendeförteckning</TypographyHeading>
          </AccordionSummary>
          <AccordionDetails style={{ display: "block" }}>
            <div>
              <div>Inkludera:</div>
              <CheckboxGroupContainer>
                <FormControl fullWidth={true}>
                  <StyledFormControlLabel
                    control={
                      <StyledCheckbox
                        checked={this.state.chAdjustToReal}
                        onChange={(e) => {
                          this.setState({ chAdjustToReal: e.target.checked });
                        }}
                        color="primary"
                      />
                    }
                    label="Anpassa till fastighetsförteckning"
                  />
                </FormControl>
                <FormControl fullWidth={true}>
                  <StyledFormControlLabel
                    control={
                      <StyledCheckbox
                        checked={this.state.chAge}
                        onChange={(e) => {
                          this.setState({ chAge: e.target.checked });
                        }}
                        color="primary"
                      />
                    }
                    label="Ålder"
                  />
                </FormControl>
                <FormControl fullWidth={true}>
                  <StyledFormControlLabel
                    control={
                      <StyledCheckbox
                        checked={this.state.chBirthdate}
                        onChange={(e) => {
                          this.setState({ chBirthdate: e.target.checked });
                        }}
                        color="primary"
                      />
                    }
                    label="Födelsedatum"
                  />
                </FormControl>
                <FormControl fullWidth={true}>
                  <StyledFormControlLabel
                    control={
                      <StyledCheckbox
                        checked={this.state.chSsn}
                        onChange={(e) => {
                          this.setState({ chSsn: e.target.checked });
                        }}
                        color="primary"
                      />
                    }
                    label="Personnummer"
                  />
                </FormControl>
                <FormControl fullWidth={true}>
                  <StyledFormControlLabel
                    control={
                      <StyledCheckbox
                        checked={this.state.chGender}
                        onChange={(e) => {
                          this.setState({ chGender: e.target.checked });
                        }}
                        color="primary"
                      />
                    }
                    label="Kön"
                  />
                </FormControl>
                <ContainerTopPadded>
                  <StyledTextField
                    label="Ange lägsta ålder"
                    value={this.state.age}
                    onChange={(e) => {
                      let v = parseInt(e.target.value);
                      if (isNaN(v)) {
                        v = 0;
                      }

                      this.setState({ age: v });
                    }}
                    onFocus={(e) => {
                      if (this.state.age === 0) {
                        this.setState({ age: "" });
                      }
                    }}
                    onBlur={(e) => {
                      if (this.state.age === "") {
                        this.setState({ age: 0 });
                      }
                    }}
                    size="small"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">år</InputAdornment>
                      ),
                    }}
                    variant="outlined"
                  />
                </ContainerTopPadded>
              </CheckboxGroupContainer>
              <div>
                <ButtonWithLoader
                  fullWidth={true}
                  variant="outlined"
                  color="primary"
                  loading={"" + this.state.loading}
                  startIcon={<this.ExcelLogo />}
                  onClick={this.handleSendClick}
                  disabled={this.state.loading}
                >
                  Skapa boendeförteckning
                  {this.state.loading && <CircularProgressButton size={24} />}
                </ButtonWithLoader>
              </div>
              <Collapse in={this.state.downloadUrl !== null}>
                <DownloadContainer>
                  <Button
                    fullWidth={true}
                    variant="outlined"
                    color="primary"
                    title={"Ladda ner: \n" + this.state.downloadUrl}
                    startIcon={<DownloadIcon />}
                    onClick={() => {
                      document.location.href = this.state.downloadUrl;
                    }}
                  >
                    Ladda ner fil
                  </Button>
                </DownloadContainer>
              </Collapse>
            </div>
          </AccordionDetails>
        </Accordion>
      </>
    );
  }
}

export default withSnackbar(FirExportResidentListView);
