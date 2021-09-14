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
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";

class FirExportView extends React.PureComponent {
  state = {
    realestateExpanded: false,
    housingExpanded: false,
    edpExpanded: false,
    age: 18,
  };

  static propTypes = {
    model: PropTypes.object.isRequired,
    app: PropTypes.object.isRequired,
    localObserver: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
  };

  static defaultProps = {};

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.localObserver = this.props.localObserver;
    this.globalObserver = this.props.app.globalObserver;
  }

  ExcelLogo() {
    return (
      <img src="/excel.svg" alt="" style={{ width: "24px", height: "auto" }} />
    );
  }

  EdpLogo() {
    return (
      <img src="/edp.svg" alt="" style={{ width: "24px", height: "auto" }} />
    );
  }

  handleHousingListClick() {
    console.log("Skapa boendeförteckning");
  }

  handleRealestateListClick() {
    console.log("Skapa fastighetsförteckning");
  }

  handleEdpClick() {
    console.log("Skicka till EDP");
  }

  render() {
    const { classes } = this.props;
    return (
      <>
        <div className={classes.root}>
          <Accordion
            expanded={this.state.realestateExpanded}
            onChange={() => {
              this.setState({
                realestateExpanded: !this.state.realestateExpanded,
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
                  onClick={this.handleRealestateListClick}
                >
                  Skapa fastighetsförteckning
                </Button>
              </div>
            </AccordionDetails>
          </Accordion>

          <Accordion
            expanded={this.state.housingExpanded}
            onChange={() => {
              this.setState({
                housingExpanded: !this.state.housingExpanded,
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
                          //checked={state.checkedA}
                          //onChange={handleChange}
                          color="primary"
                          name="checkedA"
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
                          //checked={state.checkedA}
                          //onChange={handleChange}
                          color="primary"
                          name="checkedA"
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

                        this.setState({ age: parseInt(v) });
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

                <Button
                  fullWidth={true}
                  variant="outlined"
                  color="primary"
                  className={classes.button}
                  startIcon={<this.ExcelLogo />}
                  onClick={this.handleHousingListClick}
                >
                  Skapa boendeförteckning
                </Button>
              </div>
            </AccordionDetails>
          </Accordion>

          <Accordion
            expanded={this.state.edpExpanded}
            onChange={() => {
              this.setState({
                edpExpanded: !this.state.edpExpanded,
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
                  className={classes.button}
                  startIcon={<this.EdpLogo />}
                  onClick={this.handleEdpClick}
                >
                  Skicka till EDP
                </Button>
              </div>
            </AccordionDetails>
          </Accordion>
        </div>
      </>
    );
  }
}

const styles = (theme) => ({
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

export default withStyles(styles)(withSnackbar(FirExportView));
