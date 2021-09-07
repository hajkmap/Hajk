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

class FirExportView extends React.PureComponent {
  state = {
    realestateExpanded: false,
    housingExpanded: false,
    edpExpanded: false,
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
                <Button
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
                <Button
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
});

export default withStyles(styles)(withSnackbar(FirExportView));
