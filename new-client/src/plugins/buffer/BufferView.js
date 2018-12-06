import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import PropTypes from "prop-types";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import AddIcon from "@material-ui/icons/AddBox";
import ClearIcon from "@material-ui/icons/LayersClear";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import Tooltip from "@material-ui/core/Tooltip";

var dist_val;
const listStyle3 = {
  background: "#f5f5f5",
  backgroundColor: "#f5f5f5"
};
const styles = theme => ({
  root: {
    display: "flex",
    flexWrap: "wrap"
  },
  formControl: {
    margin: theme.spacing.unit,
    minWidth: 120,
    maxWidth: 300
  },
  chips: {
    display: "flex",
    flexWrap: "wrap"
  },
  chip: {
    margin: theme.spacing.unit / 4
  }
});

class BufferView extends Component {
  state = {
    name: ""
  };
  distChange = dist => event => {
    console.log(dist);
  };
  getDistans = name => event => {
    var dist = document.querySelector("#distans").value;
    this.props.parent.BufferModel.setActiveTool(dist);
  };

  clearBuffer = event => {
    this.props.parent.BufferModel.clearBuffer();
  };
  activateTool = name => event => {
    this.props.parent.BufferModel.setActiveTool();
  };
  render() {
    const { classes } = this.props;

    return (
      <div className="Buffert Verktyg">
        Detta verktyg skapar en zon med angivet avstånd runt valda objekt i
        kartan.
        <br />
        <br />
        <Card className={classes.card}>
          <CardContent style={listStyle3}>
            <Typography component="h3">Välj objekt</Typography>
          </CardContent>
          <CardContent>
            <div>
              <Tooltip title="Markera flera objekt">
                <Button
                  variant="contained"
                  color="primary"
                  onClick={this.activateTool()}
                >
                  <AddIcon />
                </Button>
              </Tooltip>
              &nbsp;
              <Tooltip title="Rensa selektering">
                <Button
                /* onClick={() => {
                    this.props.model.clearSelection();
                  }}*/
                >
                  <ClearIcon /> Rensa Selektering
                </Button>
              </Tooltip>
            </div>
          </CardContent>
        </Card>
        <br />
        <Card className={classes.card}>
          <CardContent style={listStyle3}>
            <Typography component="h3">Ange buffertavstånd</Typography>
          </CardContent>
          <CardContent>
            <span>
              <TextField
                id="distans"
                placeholder="Avstånd i meter"
                margin="normal"
                variant="outlined"
              />
            </span>
            <br />
            <div>
              <Button
                onClick={this.getDistans()}
                variant="contained"
                color="primary"
                className={classes.button}
              >
                Buffra
              </Button>
            </div>
          </CardContent>
        </Card>
        <br />
        <Card className={classes.card}>
          <CardContent style={listStyle3}>
            <Typography component="h3">
              Rensa kartan från buffrade objekt
            </Typography>
          </CardContent>
          <CardContent>
            <Button
              onClick={this.clearBuffer()}
              variant="contained"
              color="primary"
              className={classes.button}
            >
              Rensa
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
}

BufferView.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles, { withTheme: true })(BufferView);
