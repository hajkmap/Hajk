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
import { hfetch } from "utils/FetchWrapper";

class FirExportEdpView extends React.PureComponent {
  state = {
    edpExpanded: false,
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

  EdpLogo() {
    return (
      <img src="/edp.svg" alt="" style={{ width: "24px", height: "auto" }} />
    );
  }

  getEdpDataAsArray = () => {
    let a = [];

    this.props.results.forEach((feature) => {
      a.push({ Fnr: feature.get("fnr"), Fastbet: feature.get("fastbet") });
    });

    return a;
  };

  handleEdpClick = () => {
    console.log("Skicka till EDP");

    let data = new URLSearchParams();
    data.append("json", JSON.stringify(this.getEdpDataAsArray()));
    hfetch(
      "https://kommungis.varberg.se/mapservice/edp/SendRealEstateIdentifiers",
      {
        method: "post",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        body: data,
      }
    ).then((res) => {
      console.log(res);
    });
  };

  render() {
    const { classes } = this.props;
    return (
      <>
        <Accordion
          disabled={this.props.results.length === 0}
          expanded={this.state.edpExpanded && this.props.results.length > 0}
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
      </>
    );
  }
}

const styles = (theme) => ({
  heading: {
    fontWeight: 500,
  },
});

export default withStyles(styles)(withSnackbar(FirExportEdpView));
