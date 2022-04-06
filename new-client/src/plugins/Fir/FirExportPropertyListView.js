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
import DownloadIcon from "@material-ui/icons/GetApp";
import Collapse from "@material-ui/core/Collapse";
import CircularProgress from "@material-ui/core/CircularProgress";
import { hfetch } from "utils/FetchWrapper";

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
    classes: PropTypes.object.isRequired,
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
              Fastighetsförteckning
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
                  <FormControlLabel
                    classes={{ label: classes.checkboxLabel }}
                    control={
                      <Checkbox
                        className={classes.checkbox}
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
                  <FormControlLabel
                    classes={{ label: classes.checkboxLabel }}
                    control={
                      <Checkbox
                        className={classes.checkbox}
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
                  <FormControlLabel
                    classes={{ label: classes.checkboxLabel }}
                    control={
                      <Checkbox
                        className={classes.checkbox}
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
              </div>
              <div>
                <div>
                  <Button
                    fullWidth={true}
                    variant="outlined"
                    color="primary"
                    className={
                      this.state.loading
                        ? classes.buttonLoading
                        : classes.button
                    }
                    startIcon={<this.ExcelLogo />}
                    onClick={this.handleSendClick}
                    disabled={this.state.loading}
                  >
                    Skapa fastighetsförteckning
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
            </div>
          </AccordionDetails>
        </Accordion>
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(FirExportPropertyListView));
