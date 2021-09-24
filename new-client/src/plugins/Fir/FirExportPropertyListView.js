import React from "react";
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

class FirExportPropertyListView extends React.PureComponent {
  state = {
    accordionExpanded: false,
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
  }

  handleSendClick = () => {
    console.log("Skicka");
  };

  ExcelLogo() {
    return (
      <img src="/excel.svg" alt="" style={{ width: "24px", height: "auto" }} />
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
              {/* param["samfallighet"] =
      this.get("chosenColumns").indexOf("samfallighet") != -1;
    param["ga"] = this.get("chosenColumns").indexOf("ga") != -1;
    param["rattighet"] = this.get("chosenColumns").indexOf("rattighet") != -1;
    param["persnr"] = this.get("chosenColumns").indexOf("persnr") != -1;
    param["taxerad_agare"] =
      this.get("chosenColumns").indexOf("taxerad_agare") != -1;
    param["fastighet_utskick"] =
      this.get("chosenColumns").indexOf("fastighet_utskick") != -1; */}
              <div>Inkludera:</div>
              <div className={classes.checkboxGroupContainer}>
                <FormControl fullWidth={true}>
                  <FormControlLabel
                    classes={{ label: classes.checkboxLabel }}
                    control={
                      <Checkbox
                        className={classes.checkbox}
                        //checked={state.checkedA}
                        //onChange={handleChange}
                        color="primary"
                        name="checkedA"
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
                        //checked={state.checkedA}
                        //onChange={handleChange}
                        color="primary"
                        name="checkedA"
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
                        //checked={state.checkedA}
                        //onChange={handleChange}
                        color="primary"
                        name="checkedA"
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
                        //checked={state.checkedA}
                        //onChange={handleChange}
                        color="primary"
                        name="checkedA"
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
                        //checked={state.checkedA}
                        //onChange={handleChange}
                        color="primary"
                        name="checkedA"
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
                        //checked={state.checkedA}
                        //onChange={handleChange}
                        color="primary"
                        name="checkedA"
                      />
                    }
                    label="Utskickslista"
                  />
                </FormControl>
              </div>
              <Button
                fullWidth={true}
                variant="outlined"
                color="primary"
                className={classes.button}
                startIcon={<this.ExcelLogo />}
                onClick={this.handleSendClick}
              >
                Skapa fastighetsförteckning
              </Button>
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
});

export default withStyles(styles)(withSnackbar(FirExportPropertyListView));
