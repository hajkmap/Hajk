import { useState, useRef } from "react";
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
import DownloadIcon from "@mui/icons-material/GetApp";
import Collapse from "@mui/material/Collapse";
import CircularProgress from "@mui/material/CircularProgress";
import { hfetch } from "../../utils/FetchWrapper";

const StyledFormControlLabel = styled(FormControlLabel)(({ _theme }) => ({
  fontSize: "0.875rem",
  fontWeight: "400",
}));

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

function FirExportPropertyListView({
  results,
  model,
  localObserver,
  closeSnackbar,
  enqueueSnackbar,
}) {
  const snackBarRef = useRef(null);

  const options = model.app.plugins.fir.options;

  const [state, setStateRaw] = useState(() => ({
    accordionExpanded: false,
    loading: false,
    downloadUrl: null,
    chCommunities: false,
    chCommunityFacilities: false,
    chRights: false,
    chSsn: false,
    chTaxedOwner: false,
    chSendList: false,
  }));
  const stateRef = useRef(state);

  const setState = (patch) => {
    stateRef.current = { ...stateRef.current, ...patch };
    setStateRaw(stateRef.current);
  };

  const collectAndSendData = () => {
    let ids = [];

    results.forEach((feature) => {
      ids.push("" + feature.get(options.propertyList.idField)); // force string
    });

    const params = {
      samfallighet: stateRef.current.chCommunities,
      ga: stateRef.current.chCommunityFacilities,
      rattighet: stateRef.current.chRights,
      persnr: stateRef.current.chSsn,
      taxerad_agare: stateRef.current.chTaxedOwner,
      fastighet_utskick: stateRef.current.chSendList,
    };

    let data = {
      uuid: ids,
      param: params,
    };

    let searchParams = new URLSearchParams();
    searchParams.append("json", JSON.stringify(data));
    hfetch(options.propertyList.excelExportUrl, {
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
          "Ett fel inträffade vid exporten av fastighetsförteckningen.",
          {
            variant: "error",
          }
        );
      });
  };

  const handleSendClick = () => {
    setState({ downloadUrl: null });
    setState({ loading: true });
    setTimeout(collectAndSendData, 25);
  };

  const ExcelLogo = () => {
    return (
      <img src={IconExcel()} alt="" style={{ width: "24px", height: "auto" }} />
    );
  };

  return (
    <>
      <Accordion
        disabled={results.length === 0}
        expanded={state.accordionExpanded && results.length > 0}
        onChange={() => {
          setState({
            accordionExpanded: !state.accordionExpanded,
          });
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <TypographyHeading>Fastighetsförteckning</TypographyHeading>
        </AccordionSummary>
        <AccordionDetails style={{ display: "block" }}>
          <div>
            <div>Inkludera:</div>
            <CheckboxGroupContainer>
              <FormControl fullWidth={true}>
                <StyledFormControlLabel
                  control={
                    <StyledCheckbox
                      checked={state.chCommunities}
                      onChange={(e) => {
                        setState({ chCommunities: e.target.checked });
                      }}
                      color="primary"
                    />
                  }
                  label="Samfälligheter"
                />
              </FormControl>
              <FormControl fullWidth={true}>
                <StyledFormControlLabel
                  control={
                    <StyledCheckbox
                      checked={state.chCommunityFacilities}
                      onChange={(e) => {
                        setState({
                          chCommunityFacilities: e.target.checked,
                        });
                      }}
                      color="primary"
                    />
                  }
                  label="Gemensamhetsanläggningar"
                />
              </FormControl>
              <FormControl fullWidth={true}>
                <StyledFormControlLabel
                  control={
                    <StyledCheckbox
                      checked={state.chRights}
                      onChange={(e) => {
                        setState({ chRights: e.target.checked });
                      }}
                      color="primary"
                    />
                  }
                  label="Rättigheter"
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
                      checked={state.chTaxedOwner}
                      onChange={(e) => {
                        setState({ chTaxedOwner: e.target.checked });
                      }}
                      color="primary"
                    />
                  }
                  label="Taxerad ägare"
                />
              </FormControl>
              <FormControl fullWidth={true}>
                <StyledFormControlLabel
                  control={
                    <StyledCheckbox
                      checked={state.chSendList}
                      onChange={(e) => {
                        setState({ chSendList: e.target.checked });
                      }}
                      color="primary"
                    />
                  }
                  label="Utskickslista"
                />
              </FormControl>
            </CheckboxGroupContainer>
            <div>
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
                  Skapa fastighetsförteckning
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
          </div>
        </AccordionDetails>
      </Accordion>
    </>
  );
}

FirExportPropertyListView.propTypes = {
  results: PropTypes.array.isRequired,
  model: PropTypes.object.isRequired,
  localObserver: PropTypes.object.isRequired,
};

export default withSnackbar(FirExportPropertyListView);
