import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { CompactPicker as ColorPicker } from "react-color";
import NativeSelect from "@material-ui/core/NativeSelect";
import Input from "@material-ui/core/Input";
import InputLabel from "@material-ui/core/InputLabel";
import Typography from "@material-ui/core/Typography";
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

  update = (prop, styleProp) => e => {
    var value = e.target.value,
      state = {};

    if (e.target.type === "checkbox") {
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
    if (styleProp) {
      this.props.model[styleProp] = value;
    }
  };

  // hasClass(icon) {
  //   return this.props.model.get("markerImg") ===
  //     window.location.href + `assets/icons/${icon}.png`
  //     ? "selected"
  //     : "";
  // }

  renderIcons() {
    //var icons = this.props.model.get("icons").split(",");
    var icons = [];

    // return icons.map((icon, i) => {
    //   icon = icon.trim();
    //   if (icon === "br") {
    //     return <br key={i} />;
    //   } else {
    //     var iconSrc = `assets/icons/${icon}.png`;
    //     return (
    //       <div key={i} className={this.hasClass(icon)}>
    //         <img onClick={this.setMarkerImg} src={iconSrc} />
    //       </div>
    //     );
    //   }
    // });
  }

  renderPointSettings() {
    const { classes } = this.props;
    switch (this.state.pointSettings) {
      case "point":
        return (
          <div>
            <FormControl className={classes.formControl}>
              <InputLabel>Färg</InputLabel>
              <ColorPicker
                onChange={color => {
                  this.update("pointColor", color);
                }}
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
        return <div className="point-marker-img">{this.renderIcons()}</div>;
      default:
        return undefined;
    }
  }

  render() {
    const { type } = this.props;
    const { classes } = this.props;
    switch (type) {
      case "Text":
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
              <InputLabel>Textfärg</InputLabel>
              <ColorPicker
                onChange={color => {
                  this.update("fontTextColor", color);
                }}
              />
            </FormControl>
            <FormControl className={classes.formControl}>
              <InputLabel>Bakgrundsfärg text</InputLabel>
              <ColorPicker
                onChange={color => {
                  this.update("fontBackColor", color);
                }}
              />
            </FormControl>
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
              <InputLabel>Färg</InputLabel>
              <ColorPicker
                onChange={color => {
                  this.update("lineColor", color);
                }}
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
        return (
          <div>
            <FormControl className={classes.formControl}>
              <InputLabel>Ange radie: </InputLabel>
              <Input
                type="text"
                name="circle-radius"
                value={this.state.circleRadius}
                onChange={this.update("circleRadius")}
              />
            </FormControl>
            <FormControl className={classes.formControl}>
              <InputLabel>Linjefärg</InputLabel>
              <ColorPicker
                model={this.props.model}
                property="circleLineColor"
                onChange={color => {
                  this.update("circleLineColor", color);
                }}
              />
            </FormControl>
            <FormControl className={classes.formControl}>
              <InputLabel>Fyllnadsfärg</InputLabel>
              <ColorPicker
                onChange={color => {
                  this.update("circleFillColor", color);
                }}
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
              <InputLabel>Linjefärg</InputLabel>
              <ColorPicker
                onChange={color => {
                  this.update("polygonLineColor", color);
                }}
              />
            </FormControl>
            <FormControl className={classes.formControl}>
              <InputLabel>Fyllnadsfärg</InputLabel>
              <ColorPicker
                onChange={color => {
                  this.update("polygonFillColor", color);
                }}
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
              <InputLabel>Linjefärg</InputLabel>
              <ColorPicker
                onChange={color => {
                  this.update("boxLineColor", color);
                }}
              />
            </FormControl>
            <FormControl className={classes.formControl}>
              <InputLabel>Fyllnadsfärg</InputLabel>
              <ColorPicker
                onChange={color => {
                  this.update("boxFillColor", color);
                }}
              />
            </FormControl>
            <FormControl className={classes.formControl}>
              <InputLabel>Opacitet</InputLabel>
              <NativeSelect
                value={this.state.boxFillOpacity}
                onChange={this.update("boxFillOpacity")}
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
                value={this.state.boxLineWidth}
                onChange={this.update("boxLineWidth")}
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
                value={this.state.boxLineStyle}
                onChange={this.update("boxLineStyle")}
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
