import React from "react";
import { Component } from "react";
import Button from "@material-ui/core/Button";
import DoneIcon from "@material-ui/icons/DoneOutline";
import CancelIcon from "@material-ui/icons/Cancel";
import { withStyles } from "@material-ui/core/styles";
import { green, blue } from "@material-ui/core/colors";
import RoomIcon from "@material-ui/icons/Room";

const ColorButtonGreen = withStyles(theme => ({
  root: {
    color: theme.palette.getContrastText(green[700]),
    backgroundColor: green[500],
    "&:hover": {
      backgroundColor: green[700]
    }
  }
}))(Button);

const ColorButtonBlue = withStyles(theme => ({
  root: {
    color: theme.palette.getContrastText(blue[500]),
    backgroundColor: blue[500],
    "&:hover": {
      backgroundColor: blue[700]
    }
  }
}))(Button);

class AddGeoObject extends Component {
  constructor(props) {
    super(props);
    this.state = {
      geoObject: "",
      inputVisible: false
    };
  }

  toggleInputVisibility() {
    this.setState({
      inputVisible: !this.state.inputVisible
    });
  }

  addGeoObject() {
    if (this.props.onAddGeoObject && this.state.geoObject !== "") {
      this.props.onAddGeoObject(this.state.geoObject);
      this.cancel();
    } else {
      this.setState({
        invalid: true
      });
    }
  }

  cancel() {
    this.setState({
      geoObject: "",
      inputVisible: false,
      invalid: false
    });
  }

  setGeoObject(e) {
    this.setState({
      geoObject: e.target.value,
      invalid: e.target.value.length === 0
    });
  }

  componentDidUpdate() {
    if (this.refs.input) {
      this.refs.input.focus();
    }
  }

  render() {
    var style = this.state.invalid ? { backgroundColor: "#d9534f" } : {};
    if (this.state.inputVisible) {
      return (
        <div style={{ display: "inline-block" }}>
          <input
            placeholder="Lägg till geo-objekt"
            value={this.state.geoObject}
            type="text"
            name="geo-object-title"
            ref="input"
            style={style}
            onKeyPress={e => {
              if (e.key === "Enter") {
                this.addGeoObject();
              }
            }}
            onChange={e => {
              this.setGeoObject(e);
            }}
          />
          &nbsp;
          <ColorButtonGreen
            variant="contained"
            className="btn"
            onClick={() => this.addGeoObject()}
            startIcon={<DoneIcon />}
          >
            Ok
          </ColorButtonGreen>
          &nbsp;
          <ColorButtonBlue
            variant="contained"
            className="btn btn-danger"
            onClick={() => this.cancel()}
            startIcon={<CancelIcon />}
          >
            Avbryt
          </ColorButtonBlue>
        </div>
      );
    } else {
      return (
        <div style={{ display: "inline-block" }}>
          <Button
            variant="contained"
            className="btn btn-default"
            onClick={() => this.toggleInputVisibility()}
          >
            <RoomIcon />
          </Button>
        </div>
      );
    }
  }
}

export default AddGeoObject;
