import React from "react";
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

//var dist_val;
const listStyle3 = {
  background: "#f5f5f5",
  backgroundColor: "#f5f5f5"
};
const styles = theme => ({});

class BufferView extends React.PureComponent {
  state = {
    name: ""
  };
  constructor(props) {
    // If you're not using some of properties defined below, remove them from your code.
    // They are shown here for demonstration purposes only.
    super(props);
    this.model = this.props.model;
    this.app = this.props.app;
    this.localObserver = this.props.localObserver;
    this.globalObserver = this.props.app.globalObserver;
  }
  clearBuffer = name => event => {
    this.props.model.clearBuffer();
  };

  clearSelection = name => event => {
    this.props.model.clearSelection();
  };

  activateSelecting = name => event => {
    this.props.model.activateSelecting(true);
  };
  bufferFeatures = name => event => {
    var dist = document.querySelector("#distans").value;
    this.props.model.bufferFeatures(dist);
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
                  onClick={this.activateSelecting()}
                >
                  <AddIcon />
                </Button>
              </Tooltip>
              &nbsp;
              <Tooltip title="Rensa selektering">
                <Button onClick={this.clearSelection()}>
                  <ClearIcon /> Rensa Selektering
                </Button>
              </Tooltip>
            </div>
          </CardContent>
        </Card>
        <br />
        <Card className={classes.card}>
          <CardContent style={listStyle3}>
            <Typography component="h3">
              Ange buffertavstånd (i meter)
            </Typography>
          </CardContent>
          <CardContent>
            <span>
              <TextField
                id="distans"
                margin="normal"
                variant="outlined"
                defaultValue="1000"
              />
            </span>
            <br />
            <div>
              <Button
                onClick={this.bufferFeatures()}
                variant="contained"
                color="primary"
                className={classes.button}
              >
                Skapa buffert
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
