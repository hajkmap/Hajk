import React from "react";
import { IconEdp } from "./FirIcons";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import { Typography } from "@material-ui/core";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import Collapse from "@material-ui/core/Collapse";
import { hfetch } from "utils/FetchWrapper";

class FirExportEdpView extends React.PureComponent {
  state = {
    accordionExpanded: false,
    loading: false,
    dataWasSent: false,
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

  EdpLogo() {
    return (
      <img src={IconEdp()} alt="" style={{ width: "24px", height: "auto" }} />
    );
  }

  getEdpDataAsArray = () => {
    let a = [];

    this.props.results.forEach((feature) => {
      a.push({
        Fnr: feature.get(this.options.edp.idField),
        Fastbet: feature.get(this.options.edp.designationField),
      });
    });

    return a;
  };

  handleEdpClick = () => {
    this.setState({ loading: true });

    let data = new URLSearchParams();
    data.append("json", JSON.stringify(this.getEdpDataAsArray()));
    hfetch(this.options.edp.url, {
      method: "post",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      body: data,
    })
      .then((res) => {
        clearTimeout(this.tm1);
        clearTimeout(this.tm2);
        this.tm1 = setTimeout(() => {
          this.setState({ loading: false });
          this.setState({ dataWasSent: true });
          this.tm2 = setTimeout(() => {
            this.setState({ dataWasSent: false });
          }, 3000);
        }, 1000);
      })
      .catch((err) => {
        this.setState({ loading: false });
        this.setState({ dataWasSent: false });
        this.props.closeSnackbar(this.snackBar);
        this.snackBar = this.props.enqueueSnackbar(
          "Ett fel inträffade vid exporten till EDP.",
          {
            variant: "error",
          }
        );
      });
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
            <Typography className={classes.heading}>EDP Vision</Typography>
          </AccordionSummary>
          <AccordionDetails style={{ display: "block" }}>
            <div>
              <Button
                fullWidth={true}
                variant="outlined"
                color="primary"
                className={
                  this.state.loading ? classes.buttonLoading : classes.button
                }
                startIcon={<this.EdpLogo />}
                onClick={this.handleEdpClick}
                disabled={this.state.loading}
              >
                Skicka till EDP
                {this.state.loading && (
                  <CircularProgress
                    size={24}
                    className={classes.buttonProgress}
                  />
                )}
              </Button>
              <Collapse in={this.state.dataWasSent}>
                <div className={classes.bottomContainer}>
                  <strong>{this.props.results.length}</strong> objekt skickades.
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
  heading: {
    fontWeight: 500,
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
  bottomContainer: {
    paddingTop: theme.spacing(2),
    textAlign: "center",
  },
});

export default withStyles(styles)(withSnackbar(FirExportEdpView));
