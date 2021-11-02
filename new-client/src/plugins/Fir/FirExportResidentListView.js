import React from "react";
import { IconExcel } from "./FirIcons";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import { Typography } from "@material-ui/core";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Button from "@material-ui/core/Button";
import FormControl from "@material-ui/core/FormControl";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";
import Collapse from "@material-ui/core/Collapse";
import CircularProgress from "@material-ui/core/CircularProgress";
import DownloadIcon from "@material-ui/icons/GetApp";
import { WFS } from "ol/format";
import {
  or as orFilter,
  intersects as intersectsFilter,
} from "ol/format/filter";
import { hfetch } from "utils/FetchWrapper";
class FirExportResidentListView extends React.PureComponent {
  state = {
    accordionExpanded: false,
    chAge: false,
    chBirthdate: false,
    chSsn: false,
    chGender: false,
    age: 18,
    loading: false,
    downloadUrl: null,
  };

  static propTypes = {
    results: PropTypes.array.isRequired,
    model: PropTypes.object.isRequired,
    localObserver: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
  };

  static defaultProps = {};

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.localObserver = this.props.localObserver;
    this.options = this.model.app.plugins.fir.options;
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

  getResidentExportData = (rawFeatures) => {
    /* rawFeatures is not converted to openlayer features */
    let features = rawFeatures;

    const mappings = this.options.residentList.mappings;

    features = features.filter((feature) => {
      return feature.properties[mappings.ageFieldName] >= this.state.age || 0;
    });

    let columns = [];
    let rows = [];

    // create columns

    if (this.state.chSsn === true) {
      columns.push(mappings.ssnDisplayName);
    }

    columns.push(mappings.nameDisplayName);
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

    function getValue(rawFeature, key) {
      return rawFeature.properties[key];
    }

    // create rows

    features.forEach((f) => {
      let row = [];

      if (this.state.chSsn === true) {
        row.push(this.formatSSN(getValue(f, mappings.ssnFieldName)));
      }

      row.push(getValue(f, mappings.nameFieldName));
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

  sendResidentData = (rawFeatures) => {
    const data = this.getResidentExportData(rawFeatures);

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
    let searchType = this.model.getSearchTypeById(this.options.residentList.id);

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
          // Note that this is raw json. No need to convert as we will not use it in OL.
          this.sendResidentData(data.features);
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
      this.getResidentData();
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
    const { classes } = this.props;
    return (
      <>
        <Accordion
          disabled={this.props.results.length === 0}
          expanded={
            this.state.accordionExpanded && this.props.results.length > 0
          }
          onChange={() => {
            this.setState({
              accordionExpanded: !this.state.accordionExpanded,
            });
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography className={classes.heading}>
              Boendeförteckning
            </Typography>
          </AccordionSummary>
          <AccordionDetails style={{ display: "block" }}>
            <div>
              <div>Inkludera:</div>
              <div className={classes.checkboxGroupContainer}>
                <FormControl fullWidth={true}>
                  <FormControlLabel
                    classes={{ label: classes.checkboxLabel }}
                    control={
                      <Checkbox
                        className={classes.checkbox}
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
                  <FormControlLabel
                    classes={{ label: classes.checkboxLabel }}
                    control={
                      <Checkbox
                        className={classes.checkbox}
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
                  <FormControlLabel
                    classes={{ label: classes.checkboxLabel }}
                    control={
                      <Checkbox
                        className={classes.checkbox}
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
                  <FormControlLabel
                    classes={{ label: classes.checkboxLabel }}
                    control={
                      <Checkbox
                        className={classes.checkbox}
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
                <div className={classes.containerTopPadded}>
                  <TextField
                    className={classes.textField}
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
                </div>
              </div>
              <div>
                <Button
                  fullWidth={true}
                  variant="outlined"
                  color="primary"
                  className={
                    this.state.loading ? classes.buttonLoading : classes.button
                  }
                  startIcon={<this.ExcelLogo />}
                  onClick={this.handleSendClick}
                  disabled={this.state.loading}
                >
                  Skapa boendeförteckning
                  {this.state.loading && (
                    <CircularProgress
                      size={24}
                      className={classes.buttonProgress}
                    />
                  )}
                </Button>
              </div>
              <Collapse in={this.state.downloadUrl !== null}>
                <div className={classes.downloadContainer}>
                  <Button
                    fullWidth={true}
                    variant="outlined"
                    color="primary"
                    title={"Ladda ner: \n" + this.state.downloadUrl}
                    className={classes.button}
                    startIcon={<DownloadIcon />}
                    onClick={() => {
                      document.location.href = this.state.downloadUrl;
                    }}
                  >
                    Ladda ner fil
                  </Button>
                </div>
              </Collapse>
            </div>
          </AccordionDetails>
        </Accordion>
      </>
    );
  }
}

const styles = (theme) => ({
  info: {
    padding: theme.spacing(2),
  },
  num: {
    fontWeight: 500,
    fontSize: "1rem",
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
  checkboxGroupContainer: {
    paddingBottom: theme.spacing(2),
  },
  containerTopPadded: {
    paddingTop: theme.spacing(2),
  },
  containerTopDoublePadded: {
    paddingTop: theme.spacing(4),
  },
  textField: {
    width: "50%",
  },
  downloadContainer: {
    paddingTop: theme.spacing(2),
  },
  buttonLoading: {
    "& img": {
      opacity: 0.3,
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

export default withStyles(styles)(withSnackbar(FirExportResidentListView));
