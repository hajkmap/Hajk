import { useState, useEffect, useRef } from "react";
import { IconExcel } from "./FirIcons";
import PropTypes from "prop-types";
import { styled } from "@mui/material/styles";
import withSnackbar from "components/WithSnackbar";
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

const TypographyHeading = styled(Typography)(({ _theme }) => ({
  fontWeight: 500,
}));

const StyledCheckbox = styled(Checkbox)(({ _theme }) => ({
  paddingTop: "0.25rem",
  paddingBottom: "0.25rem",
}));

const CheckboxGroupContainer = styled("div")(({ theme }) => ({
  paddingBottom: theme.spacing(2),
}));

const ContainerTopPadded = styled("div")(({ theme }) => ({
  paddingTop: theme.spacing(2),
}));

const StyledTextField = styled(TextField)(({ _theme }) => ({
  width: "50%",
}));

const DownloadContainer = styled("div")(({ theme }) => ({
  paddingTop: theme.spacing(2),
}));

const CircularProgressButton = styled(CircularProgress)(({ _theme }) => ({
  position: "absolute",
  top: "50%",
  left: "50%",
  marginTop: -12,
  marginLeft: -12,
}));

const StyledFormControlLabel = styled(FormControlLabel)(({ _theme }) => ({
  fontSize: "0.875rem",
  fontWeight: "400",
}));

function FirExportResidentListView({
  results,
  model,
  localObserver,
  type,
  closeSnackbar,
  enqueueSnackbar,
}) {
  const snackBarRef = useRef(null);
  const fnsRef = useRef({});

  const _type = type ?? "fir"; // kir or fir
  const options = model.app.plugins[_type].options;

  const [state, setStateRaw] = useState(() => ({
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

  const getGeometryFilters = (features) => {
    let filters = [];
    features.forEach((feature) => {
      filters.push(
        intersectsFilter(
          options.wfsRealEstateLayer.geometryField,
          feature.getGeometry()
        )
      );
    });

    return filters.length === 0 ? null : filters;
  };

  const getFiltersForStringAndGeometrySearch = (params) => {
    let rootFilter = null;

    if (params.features.length > 0) {
      rootFilter = getGeometryFilters(params.features);
    }

    if (rootFilter && rootFilter.length >= 2) {
      // wrap when more than 1
      rootFilter = orFilter(...rootFilter);
    } else if (rootFilter && rootFilter.length === 1) {
      rootFilter = rootFilter[0];
    }

    return rootFilter;
  };

  const getFeatureRequestObject = (params) => {
    let rootFilter = getFiltersForStringAndGeometrySearch(params);

    return {
      srsName: model.config.srsName,
      featureNS: "https://www.opengis.net",
      outputFormat: "application/json",
      maxFeatures: options.maxFeatures,
      featureTypes: [params.featureType],
      filter: rootFilter,
    };
  };

  const getRequestXml = (params) => {
    const featureRequestObject = getFeatureRequestObject(params);
    const featureRequest = new WFS().writeGetFeature(featureRequestObject);
    return new XMLSerializer().serializeToString(featureRequest);
  };

  const getResidentExportData = (features) => {
    const mappings = options.residentList.mappings;

    features = features.filter((feature) => {
      return feature.get(mappings.ageFieldName) >= stateRef.current.age || 0;
    });

    let columns = [];
    let rows = [];

    // create columns

    if (stateRef.current.chAdjustToReal) {
      columns.push(" ");
    }

    if (stateRef.current.chSsn === true) {
      columns.push(mappings.ssnDisplayName);
    }

    columns.push(mappings.nameDisplayName);

    if (stateRef.current.chAdjustToReal) {
      columns.push("I egenskap av");
      columns.push("  ");
    }

    columns.push(mappings.addressDisplayName);
    columns.push(mappings.postalCodeDisplayName);
    columns.push(mappings.cityDisplayName);

    if (stateRef.current.chAge) {
      columns.push(mappings.ageDisplayName);
    }

    if (stateRef.current.chBirthdate) {
      columns.push(mappings.birthDateDisplayName);
    }

    if (stateRef.current.chGender) {
      columns.push(mappings.genderDisplayName);
    }

    function getValue(feature, key) {
      return feature.get(key);
    }

    // create rows

    features.forEach((f) => {
      let row = [];

      if (stateRef.current.chAdjustToReal) {
        row.push(" ");
      }

      if (stateRef.current.chSsn === true) {
        row.push(formatSSN(getValue(f, mappings.ssnFieldName)));
      }

      row.push(getValue(f, mappings.nameFieldName));

      if (stateRef.current.chAdjustToReal) {
        row.push("Boende");
        row.push("  ");
      }

      row.push(getValue(f, mappings.addressFieldName));
      row.push(getValue(f, mappings.postalCodeFieldName));
      row.push(getValue(f, mappings.cityFieldName));

      if (stateRef.current.chAge) {
        row.push(getValue(f, mappings.ageFieldName));
      }

      if (stateRef.current.chBirthdate) {
        row.push(formatBirthDate(getValue(f, mappings.birthDateFieldName)));
      }

      if (stateRef.current.chGender) {
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

  const sendResidentData = (features) => {
    const data = getResidentExportData(features);

    let searchParams = new URLSearchParams();
    searchParams.append("json", JSON.stringify(data));

    hfetch(options.residentList.excelExportUrl, {
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
          setState({ loading: false });
          setState({ downloadUrl: text });
        }
      })
      .catch((_err, _a) => {
        setState({ loading: false });
        setState({ downloadUrl: null });
        closeSnackbar(snackBarRef.current);
        snackBarRef.current = enqueueSnackbar(
          "Ett fel inträffade vid exporten av boendeförteckningen.",
          {
            variant: "error",
          }
        );
      });
  };

  const getResidentData = () => {
    let searchType = model.getWfsById(options.residentList.id);
    let params = {
      featureType: searchType.layers[0],
      url: searchType.url,
      searchProp: searchType.geometryField,
      features: results,
    };

    const requestXml = getRequestXml(params);

    hfetch(params.url, {
      method: "POST",
      body: requestXml,
    })
      .then((response) => {
        return response ? response.json() : null;
      })
      .then((data) => {
        if (data.features?.length > 0) {
          sendResidentData(new GeoJSON().readFeatures(data));
        } else {
          setState({ loading: false });
          closeSnackbar(snackBarRef.current);
          snackBarRef.current = enqueueSnackbar(
            "Kunde ej hitta några boende att exportera.",
            {
              variant: "warning",
            }
          );
        }
      })
      .catch((_err) => {
        setState({ loading: false });
        closeSnackbar(snackBarRef.current);
        snackBarRef.current = enqueueSnackbar(
          "Ett fel inträffade vid exporten.",
          {
            variant: "error",
          }
        );
      });
  };

  const handleSendClick = () => {
    setState({ loading: true });
    setState({ downloadUrl: null });
    // detach
    setTimeout(() => {
      if (type === "kir") {
        // In KIR we already have the data so we just send it.
        sendResidentData(stateRef.current.results);
      } else {
        getResidentData();
      }
    }, 25);
  };

  fnsRef.current = {
    handleResultsFiltered: (list) => {
      setState({ results: [...list] });
      forceUpdate();
    },
  };

  useEffect(() => {
    localObserver.subscribe(`${_type}.results.filtered`, (list) => {
      fnsRef.current.handleResultsFiltered(list);
    });

    if (_type === "kir") {
      // Kir only have one item in accordion, expand it automatically.
      setState({ accordionExpanded: true });
    }
  }, [localObserver, fnsRef, _type]);

  const ExcelLogo = () => {
    return (
      <img src={IconExcel()} alt="" style={{ width: "24px", height: "auto" }} />
    );
  };

  const formatSSN = (ssn) => {
    ssn = "" + ssn;
    let _ssn = ssn.substring(0, ssn.length - 4);
    _ssn += "-" + ssn.substr(ssn.length - 4, 4);
    return _ssn;
  };

  const formatBirthDate = (birthDate) => {
    return birthDate.substring(0, birthDate.length - 4);
  };

  return (
    <>
      <Accordion
        disabled={results.length === 0 || !options.residentList}
        expanded={
          state.accordionExpanded &&
          results.length > 0 &&
          options.residentList !== null
        }
        onChange={() => {
          setState({
            accordionExpanded: !state.accordionExpanded,
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
                      checked={state.chAdjustToReal}
                      onChange={(e) => {
                        setState({ chAdjustToReal: e.target.checked });
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
                      checked={state.chAge}
                      onChange={(e) => {
                        setState({ chAge: e.target.checked });
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
                      checked={state.chBirthdate}
                      onChange={(e) => {
                        setState({ chBirthdate: e.target.checked });
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
                      checked={state.chSsn}
                      onChange={(e) => {
                        setState({ chSsn: e.target.checked });
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
                      checked={state.chGender}
                      onChange={(e) => {
                        setState({ chGender: e.target.checked });
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
                  value={state.age}
                  onChange={(e) => {
                    let v = parseInt(e.target.value);
                    if (isNaN(v)) {
                      v = 0;
                    }

                    setState({ age: v });
                  }}
                  onFocus={(_e) => {
                    if (stateRef.current.age === 0) {
                      setState({ age: "" });
                    }
                  }}
                  onBlur={(_e) => {
                    if (stateRef.current.age === "") {
                      setState({ age: 0 });
                    }
                  }}
                  size="small"
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">år</InputAdornment>
                      ),
                    },
                  }}
                  variant="outlined"
                />
              </ContainerTopPadded>
            </CheckboxGroupContainer>
            <div>
              <Button
                fullWidth={true}
                variant="outlined"
                color="primary"
                startIcon={<ExcelLogo />}
                onClick={handleSendClick}
                disabled={state.loading}
                sx={{ opacity: state.loading ? 0.3 : 1.0 }}
              >
                Skapa boendeförteckning
                {state.loading && <CircularProgressButton size={24} />}
              </Button>
            </div>
            <Collapse in={state.downloadUrl !== null}>
              <DownloadContainer>
                <Button
                  fullWidth={true}
                  variant="outlined"
                  color="primary"
                  title={"Ladda ner: \n" + state.downloadUrl}
                  startIcon={<DownloadIcon />}
                  onClick={() => {
                    document.location.href = state.downloadUrl;
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

FirExportResidentListView.propTypes = {
  results: PropTypes.array.isRequired,
  model: PropTypes.object.isRequired,
  localObserver: PropTypes.object.isRequired,
  type: PropTypes.string,
};

export default withSnackbar(FirExportResidentListView);
