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
import DownloadIcon from "@material-ui/icons/GetApp";
import Collapse from "@mui/material/Collapse";
import CircularProgress from "@mui/material/CircularProgress";
import { hfetch } from "utils/FetchWrapper";

const ButtonWithLoader = styled(Button)(({ theme, loading }) => ({
  "& img": {
    opacity: loading === "true" ? 0.3 : 1.0,
  },
}));

const StyledFormControlLabel = styled(FormControlLabel)(({ theme }) => ({
  fontSize: "0.875rem",
  fontWeight: "400",
}));

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
class FirExportPropertyListView extends React.PureComponent {
  state = {
    accordionExpanded: false,
    loading: false,
    downloadUrl: null,
    chCommunities: false,
    chCommunityFacilities: false,
    chRights: false,
    chSsn: false,
    chTaxedOwner: false,
    chSendList: false,
  };

  static propTypes = {
    results: PropTypes.array.isRequired,
    model: PropTypes.object.isRequired,
    localObserver: PropTypes.object.isRequired,
  };

  static defaultProps = {};

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.localObserver = this.props.localObserver;
    this.options = this.model.app.plugins.fir.options;
  }

  #collectAndSendData = () => {
    let fnrList = [];

    this.props.results.forEach((feature) => {
      fnrList.push("" + feature.get(this.options.propertyList.idField)); // force string
    });

    const params = {
      samfallighet: this.state.chCommunities,
      ga: this.state.chCommunityFacilities,
      rattigheter: this.state.chRights,
      persnr: this.state.chSsn,
      taxerad_agare: this.state.chTaxedOwner,
      fastighet_utskick: this.state.chSendList,
    };

    let data = {
      fnr: fnrList,
      param: params,
    };

    let searchParams = new URLSearchParams();
    searchParams.append("json", JSON.stringify(data));
    hfetch(this.options.propertyList.excelExportUrl, {
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
          "Ett fel inträffade vid exporten av fastighetsförteckningen.",
          {
            variant: "error",
          }
        );
      });
  };

  handleSendClick = () => {
    this.setState({ downloadUrl: null });
    this.setState({ loading: true });
    setTimeout(this.#collectAndSendData, 25);
  };

  ExcelLogo() {
    return (
      <img src={IconExcel()} alt="" style={{ width: "24px", height: "auto" }} />
    );
  }

  render() {
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
                        checked={this.state.chCommunities}
                        onChange={(e) => {
                          this.setState({ chCommunities: e.target.checked });
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
                        checked={this.state.chCommunityFacilities}
                        onChange={(e) => {
                          this.setState({
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
                        checked={this.state.chRights}
                        onChange={(e) => {
                          this.setState({ chRights: e.target.checked });
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
                        checked={this.state.chTaxedOwner}
                        onChange={(e) => {
                          this.setState({ chTaxedOwner: e.target.checked });
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
                        checked={this.state.chSendList}
                        onChange={(e) => {
                          this.setState({ chSendList: e.target.checked });
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
                  <ButtonWithLoader
                    fullWidth={true}
                    variant="outlined"
                    color="primary"
                    loading={"" + this.state.loading}
                    startIcon={<this.ExcelLogo />}
                    onClick={this.handleSendClick}
                    disabled={this.state.loading}
                  >
                    Skapa fastighetsförteckning
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
            </div>
          </AccordionDetails>
        </Accordion>
      </>
    );
  }
}

export default withSnackbar(FirExportPropertyListView);
