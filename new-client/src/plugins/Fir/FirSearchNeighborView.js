import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionDetails from "@material-ui/core/AccordionDetails";
import FormControl from "@material-ui/core/FormControl";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Radio from "@material-ui/core/Radio";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";
import Collapse from "@material-ui/core/Collapse";
import Button from "@material-ui/core/Button";

import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import { Typography } from "@material-ui/core";

class FirSearchNeighborView extends React.PureComponent {
  state = {
    neighborExpanded: false,
    radioValue: "delimiting",
    buffer: 50,

    // open: false,
    // results: { list: [] },
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

  handleRadioChange = (e) => {
    this.setState({ radioValue: e.target.value });
  };

  handleClearSearch() {
    console.log("Clear search!");
  }

  handleSearch() {
    console.log("Search!");
  }

  render() {
    const { classes } = this.props;

    return (
      <>
        <Accordion
          expanded={this.state.neighborExpanded}
          onChange={() => {
            this.setState({
              neighborExpanded: !this.state.neighborExpanded,
            });
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography className={classes.heading}>Hitta grannar</Typography>
          </AccordionSummary>
          <AccordionDetails style={{ display: "block" }}>
            <FormControl fullWidth={true}>
              <RadioGroup
                aria-label="search-type"
                name="searchType"
                value={this.state.radioValue}
                onChange={this.handleRadioChange}
              >
                <FormControlLabel
                  classes={{
                    label: classes.radioLabel,
                  }}
                  value="delimiting"
                  control={<Radio className={classes.radio} color="primary" />}
                  label="Hitta angränsade grannar"
                />
                <FormControlLabel
                  classes={{
                    label: classes.radioLabel,
                  }}
                  value="radius"
                  control={<Radio className={classes.radio} color="primary" />}
                  label="Hitta grannar inom X meter"
                />
              </RadioGroup>
            </FormControl>
            <Collapse in={this.state.radioValue === "radius"}>
              <div className={classes.containerTopPadded}>
                <TextField
                  fullWidth={true}
                  label="Buffer"
                  value={this.state.buffer}
                  onChange={(e) => {
                    let v = parseInt(e.target.value);
                    if (isNaN(v)) {
                      v = 0;
                    }

                    this.setState({ buffer: parseInt(v) });
                  }}
                  onFocus={(e) => {
                    if (this.state.buffer === 0) {
                      this.setState({ buffer: "" });
                    }
                  }}
                  onBlur={(e) => {
                    if (this.state.buffer === "") {
                      this.setState({ buffer: 0 });
                    }
                  }}
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">meter</InputAdornment>
                    ),
                  }}
                  variant="outlined"
                />
              </div>
            </Collapse>
            <div
              className={classes.containerTopPadded}
              style={{ textAlign: "right" }}
            >
              <Button
                variant="outlined"
                color="primary"
                component="span"
                size="small"
                onClick={this.handleClearSearch}
                className={classes.clearButton}
              >
                Rensa
              </Button>
              <Button
                variant="contained"
                color="primary"
                component="span"
                size="small"
                onClick={this.handleSearch}
              >
                Sök
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
  radio: {
    paddingTop: "0.25rem",
    paddingBottom: "0.25rem",
  },
  radioLabel: {
    fontSize: "0.875rem",
    fontWeight: "400",
  },
  containerTopPadded: {
    paddingTop: theme.spacing(2),
  },
  containerTopDoublePadded: {
    paddingTop: theme.spacing(4),
  },
  clearButton: {
    marginRight: theme.spacing(2),
  },
});

export default withStyles(styles)(withSnackbar(FirSearchNeighborView));
