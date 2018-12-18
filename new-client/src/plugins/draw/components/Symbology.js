import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { CompactPicker as ColorPicker } from "react-color";
import NativeSelect from "@material-ui/core/NativeSelect";
import Checkbox from "@material-ui/core/Checkbox";
import Input from "@material-ui/core/Input";
import InputLabel from "@material-ui/core/InputLabel";
import FormControl from "@material-ui/core/FormControl";

const styles = theme => ({
  root: {
    display: "flex",
    flexWrap: "wrap"
  },
  formControl: {
    margin: theme.spacing.unit,
    minWidth: 120
  },
  selectEmpty: {
    marginTop: theme.spacing.unit * 2
  },
  row: {
    marginBottom: "10px"
  }
});

class Symbology extends React.PureComponent {
  state = {
    shape: "LineString"
  };

  componentDidMount() {
    const { model } = this.props;
    this.setState({
      fontSize: model.fontSize,
      fontTextColor: model.fontTextColor,
      fontBackColor: model.fontBackColor,
      fontStroke: model.fontStroke,
      pointText: model.pointText,
      pointColor: model.pointColor,
      pointRadius: model.pointRadius,
      lineColor: model.lineColor,
      lineWidth: model.lineWidth,
      lineStyle: model.lineStyle,
      circleFillColor: model.circleFillColor,
      circleLineColor: model.circleLineColor,
      circleFillOpacity: model.circleFillOpacity,
      circleLineStyle: model.circleLineStyle,
      circleLineWidth: model.circleLineWidth,
      circleRadius: model.circleRadius,
      polygonLineColor: model.polygonLineColor,
      polygonLineWidth: model.polygonLineWidth,
      polygonLineStyle: model.polygonLineStyle,
      polygonFillColor: model.polygonFillColor,
      polygonFillOpacity: model.polygonFillOpacity,
      squareFillColor: model.squareFillColor,
      squareLineColor: model.squareLineColor,
      squareFillOpacity: model.squareFillOpacity,
      squareLineStyle: model.squareLineStyle,
      squareLineWidth: model.squareLineWidth,
      pointSettings: model.pointSettings
    });
  }

  update = prop => e => {
    var value = e.hex ? e.hex : e.target.value,
      state = {};

    if (e.target && e.target.type === "checkbox") {
      value = e.target.checked;
    }

    if (typeof value === "string") {
      value = !isNaN(parseFloat(value))
        ? parseFloat(value)
        : !isNaN(parseInt(value))
        ? parseInt(value)
        : value;
    }
    state[prop] = value;
    this.setState(state);
    this.props.model[prop] = value;
  };

  renderPointSettings() {
    const { classes } = this.props;
    switch (this.state.pointSettings) {
      case "point":
        return (
          <div>
            <FormControl className={classes.formControl}>
              <div>Färg</div>
              <ColorPicker
                color={this.state.pointColor}
                onChange={this.update("pointColor")}
              />
            </FormControl>
            <FormControl className={classes.formControl}>
              <InputLabel>Storlek</InputLabel>
              <NativeSelect
                value={this.state.pointRadius}
                onChange={this.update("pointRadius")}
              >
                <option value="4">Liten</option>
                <option value="7">Normal</option>
                <option value="14">Stor</option>
                <option value="20">Större</option>
              </NativeSelect>
            </FormControl>
          </div>
        );
      case "symbol":
        return <div>Val av ikon är ännu inte tillgängligt.</div>;
      default:
        return undefined;
    }
  }

  render() {
    const { type } = this.props;
    const { classes } = this.props;
    switch (type) {
      case "Text":
        if (this.state.fontStroke === undefined) {
          return <div />;
        }
        return (
          <div>
            <FormControl className={classes.formControl}>
              <InputLabel>Textstorlek</InputLabel>
              <NativeSelect
                value={this.state.fontSize}
                onChange={this.update("fontSize")}
              >
                <option value="8">8</option>
                <option value="10">10</option>
                <option value="12">12</option>
                <option value="14">14</option>
                <option value="16">16</option>
                <option value="18">18</option>
                <option value="20">20</option>
                <option value="30">30</option>
                <option value="40">40</option>
                <option value="60">60</option>
                <option value="80">100</option>
              </NativeSelect>
            </FormControl>
            <FormControl className={classes.formControl}>
              <div>Textfärg</div>
              <ColorPicker
                color={this.state.fontTextColor}
                onChange={this.update("fontTextColor")}
              />
            </FormControl>
            <FormControl className={classes.formControl}>
              <div>Bakgrundsfärg text</div>
              <ColorPicker
                color={this.state.fontBackColor}
                onChange={this.update("fontBackColor")}
              />
            </FormControl>
            <div>
              <div>Ingen bakgrundsfärg</div>
              <Checkbox
                checked={this.state.fontStroke}
                onChange={this.update("fontStroke")}
                color="primary"
              />
            </div>
          </div>
        );
      case "Point":
        return (
          <div>
            <FormControl className={classes.formControl}>
              <InputLabel>Välj typ</InputLabel>
              <NativeSelect
                value={this.state.pointSettings}
                onChange={this.update("pointSettings")}
              >
                <option key="point" value="point">
                  Punkt
                </option>
                <option key="symbol" value="symbol">
                  Symbol
                </option>
              </NativeSelect>
            </FormControl>
            {this.renderPointSettings()}
          </div>
        );
      case "LineString":
        return (
          <div>
            <FormControl className={classes.formControl}>
              <div>Färg</div>
              <ColorPicker
                color={this.state.lineColor}
                onChange={this.update("lineColor")}
              />
            </FormControl>
            <FormControl className={classes.formControl}>
              <InputLabel>Tjocklek</InputLabel>
              <NativeSelect
                value={this.state.lineWidth}
                onChange={this.update("lineWidth")}
              >
                <option value="1">Tunn</option>
                <option value="3">Normal</option>
                <option value="5">Tjock</option>
                <option value="8">Tjockare</option>
              </NativeSelect>
            </FormControl>
            <FormControl className={classes.formControl}>
              <InputLabel>Stil</InputLabel>
              <NativeSelect
                value={this.state.lineStyle}
                onChange={this.update("lineStyle")}
              >
                <option value="solid">Heldragen</option>
                <option value="dash">Streckad</option>
                <option value="dot">Punktad</option>
              </NativeSelect>
            </FormControl>
          </div>
        );
      case "Circle":
        if (this.state.circleRadius === undefined) {
          return <div />;
        }
        return (
          <div>
            <FormControl className={classes.formControl}>
              <InputLabel>Ange radie: </InputLabel>
              <Input
                type="text"
                value={this.state.circleRadius}
                onChange={this.update("circleRadius")}
              />
            </FormControl>
            <FormControl className={classes.formControl}>
              <div>Linjefärg</div>
              <ColorPicker
                color={this.state.circleLineColor}
                onChange={this.update("circleLineColor")}
              />
            </FormControl>
            <FormControl className={classes.formControl}>
              <div>Fyllnadsfärg</div>
              <ColorPicker
                color={this.state.circleFillColor}
                onChange={this.update("circleFillColor")}
              />
            </FormControl>
            <FormControl className={classes.formControl}>
              <InputLabel>Opacitet</InputLabel>
              <NativeSelect
                value={this.state.circleFillOpacity}
                onChange={this.update("circleFillOpacity")}
              >
                <option value="0">0% (genomskinlig)</option>
                <option value="0.25">25%</option>
                <option value="0.5">50%</option>
                <option value="0.75">75%</option>
                <option value="1">100% (fylld)</option>
              </NativeSelect>
            </FormControl>
            <FormControl className={classes.formControl}>
              <InputLabel>Linjetjocklek</InputLabel>
              <NativeSelect
                value={this.state.circleLineWidth}
                onChange={this.update("circleLineWidth")}
              >
                <option value="1">Tunn</option>
                <option value="3">Normal</option>
                <option value="5">Tjock</option>
                <option value="8">Tjockare</option>
              </NativeSelect>
            </FormControl>
            <FormControl className={classes.formControl}>
              <InputLabel>Linjestil</InputLabel>
              <NativeSelect
                value={this.state.circleLineStyle}
                onChange={this.update("circleLineStyle")}
              >
                <option value="solid">Heldragen</option>
                <option value="dash">Streckad</option>
                <option value="dot">Punktad</option>
              </NativeSelect>
            </FormControl>
          </div>
        );
      case "Polygon":
        return (
          <div>
            <FormControl className={classes.formControl}>
              <div>Linjefärg</div>
              <ColorPicker
                color={this.state.polygonLineColor}
                onChange={this.update("polygonLineColor")}
              />
            </FormControl>
            <FormControl className={classes.formControl}>
              <div>Fyllnadsfärg</div>
              <ColorPicker
                color={this.state.polygonFillColor}
                onChange={this.update("polygonFillColor")}
              />
            </FormControl>
            <FormControl className={classes.formControl}>
              <InputLabel>Opacitet</InputLabel>
              <NativeSelect
                value={this.state.polygonFillOpacity}
                onChange={this.update("polygonFillOpacity")}
              >
                <option value="0">0% (genomskinlig)</option>
                <option value="0.25">25%</option>
                <option value="0.5">50%</option>
                <option value="0.75">75%</option>
                <option value="1">100% (fylld)</option>
              </NativeSelect>
            </FormControl>
            <FormControl className={classes.formControl}>
              <InputLabel>Linjetjocklek</InputLabel>
              <NativeSelect
                value={this.state.polygonLineWidth}
                onChange={this.update("polygonLineWidth")}
              >
                <option value="1">Tunn</option>
                <option value="3">Normal</option>
                <option value="5">Tjock</option>
                <option value="8">Tjockare</option>
              </NativeSelect>
            </FormControl>
            <FormControl className={classes.formControl}>
              <InputLabel>Linjestil</InputLabel>
              <NativeSelect
                value={this.state.polygonLineStyle}
                onChange={this.update("polygonLineStyle")}
              >
                <option value="solid">Heldragen</option>
                <option value="dash">Streckad</option>
                <option value="dot">Punktad</option>
              </NativeSelect>
            </FormControl>
          </div>
        );
      case "Square":
        return (
          <div>
            <FormControl className={classes.formControl}>
              <div>Linjefärg</div>
              <ColorPicker
                color={this.state.squareLineColor}
                onChange={this.update("squareLineColor")}
              />
            </FormControl>
            <FormControl className={classes.formControl}>
              <div>Fyllnadsfärg</div>
              <ColorPicker
                color={this.state.squareFillColor}
                onChange={this.update("squareFillColor")}
              />
            </FormControl>
            <FormControl className={classes.formControl}>
              <InputLabel>Opacitet</InputLabel>
              <NativeSelect
                value={this.state.squareFillOpacity}
                onChange={this.update("squareFillOpacity")}
              >
                <option value="0">0% (genomskinlig)</option>
                <option value="0.25">25%</option>
                <option value="0.5">50%</option>
                <option value="0.75">75%</option>
                <option value="1">100% (fylld)</option>
              </NativeSelect>
            </FormControl>
            <FormControl className={classes.formControl}>
              <InputLabel>Linjetjocklek</InputLabel>
              <NativeSelect
                value={this.state.squareLineWidth}
                onChange={this.update("squareLineWidth")}
              >
                <option value="1">Tunn</option>
                <option value="3">Normal</option>
                <option value="5">Tjock</option>
                <option value="8">Tjockare</option>
              </NativeSelect>
            </FormControl>
            <FormControl className={classes.formControl}>
              <InputLabel>Linjestil</InputLabel>
              <NativeSelect
                value={this.state.squareLineStyle}
                onChange={this.update("squareLineStyle")}
              >
                <option value="solid">Heldragen</option>
                <option value="dash">Streckad</option>
                <option value="dot">Punktad</option>
              </NativeSelect>
            </FormControl>
          </div>
        );
      default:
        return <div />;
    }
  }
}

export default withStyles(styles)(Symbology);
