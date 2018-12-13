import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { CompactPicker as ColorPicker } from "react-color";

const styles = theme => ({});

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
    switch (this.state.pointSettings) {
      case "point":
        return (
          <div>
            <div>Färg</div>
            <ColorPicker
              onChange={color => {
                console.log(color);
              }}
            />
            <div>Storlek</div>
            <select
              value={this.state.pointRadius}
              onChange={this.update("pointRadius")}
            >
              <option value="4">Liten</option>
              <option value="7">Normal</option>
              <option value="14">Stor</option>
              <option value="20">Större</option>
            </select>
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
    switch (type) {
      case "Text":
        return (
          <div>
            <h2>Ritmanér text</h2>
            <div>Textstorlek</div>
            <select
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
            </select>
            <div>Textfärg</div>
            <ColorPicker
              onChange={color => {
                console.log("Font color", color);
              }}
            />
            <div>Bakgrundsfärg text</div>
            <ColorPicker
              onChange={color => {
                console.log("Font back color", color);
              }}
            />
          </div>
        );
      case "Point":
        return (
          <div>
            <h2>Ritmanér punkt</h2>
            <label>Välj typ</label>
            <div>
              <select
                value={this.state.pointSettings}
                onChange={this.update("pointSettings")}
              >
                <option key="point" value="point">
                  Punkt
                </option>
                <option key="symbol" value="symbol">
                  Symbol
                </option>
              </select>
            </div>
            {this.renderPointSettings()}
          </div>
        );
      case "LineString":
        return (
          <div>
            <h2>Ritmanér linje</h2>
            <div>Färg</div>
            <ColorPicker
              onChange={color => {
                this.props.model.strokeColor = color;
              }}
            />
            <div>Tjocklek</div>
            <select
              value={this.state.lineWidth}
              onChange={this.update("lineWidth", "strokeWidth")}
            >
              <option value="1">Tunn</option>
              <option value="3">Normal</option>
              <option value="5">Tjock</option>
              <option value="8">Tjockare</option>
            </select>
            <div>Stil</div>
            <select
              value={this.state.lineStyle}
              onChange={this.update("lineStyle")}
            >
              <option value="solid">Heldragen</option>
              <option value="dash">Streckad</option>
              <option value="dot">Punktad</option>
            </select>
          </div>
        );
      case "Circle":
        return (
          <div>
            <h2>Ritmanér cirkel</h2>
            <label>Ange radie: </label>
            &nbsp;
            <input
              type="text"
              name="circle-radius"
              value={this.state.circleRadius}
              onChange={this.update("circleRadius")}
            />
            <div>Linjefärg</div>
            <ColorPicker
              model={this.props.model}
              property="circleLineColor"
              onChange={this.update("circleLineColor")}
            />
            <div>Fyllnadsfärg</div>
            <ColorPicker
              onChange={color => {
                console.log("Circle fill color", color);
              }}
            />
            <div>Opacitet</div>
            <select
              value={this.state.circleFillOpacity}
              onChange={this.update("circleFillOpacity")}
            >
              <option value="0">0% (genomskinlig)</option>
              <option value="0.25">25%</option>
              <option value="0.5">50%</option>
              <option value="0.75">75%</option>
              <option value="1">100% (fylld)</option>
            </select>
            <div>Linjetjocklek</div>
            <select
              value={this.state.circleLineWidth}
              onChange={this.update("circleLineWidth")}
            >
              <option value="1">Tunn</option>
              <option value="3">Normal</option>
              <option value="5">Tjock</option>
              <option value="8">Tjockare</option>
            </select>
            <div>Linjestil</div>
            <select
              value={this.state.circleLineStyle}
              onChange={this.update("circleLineStyle")}
            >
              <option value="solid">Heldragen</option>
              <option value="dash">Streckad</option>
              <option value="dot">Punktad</option>
            </select>
          </div>
        );
      case "Polygon":
        return (
          <div>
            <h2>Ritmanér yta</h2>
            <div>Linjefärg</div>
            <ColorPicker
              onChange={color => {
                console.log("Polygon line color", color);
              }}
            />
            <div>Fyllnadsfärg</div>
            <ColorPicker
              onChange={color => {
                console.log("Polygon fill color", color);
              }}
            />
            <div>Opacitet</div>
            <select
              value={this.state.polygonFillOpacity}
              onChange={this.update("polygonFillOpacity")}
            >
              <option value="0">0% (genomskinlig)</option>
              <option value="0.25">25%</option>
              <option value="0.5">50%</option>
              <option value="0.75">75%</option>
              <option value="1">100% (fylld)</option>
            </select>
            <div>Linjetjocklek</div>
            <select
              value={this.state.polygonLineWidth}
              onChange={this.update("polygonLineWidth")}
            >
              <option value="1">Tunn</option>
              <option value="3">Normal</option>
              <option value="5">Tjock</option>
              <option value="8">Tjockare</option>
            </select>
            <div>Linjestil</div>
            <select
              value={this.state.polygonLineStyle}
              onChange={this.update("polygonLineStyle")}
            >
              <option value="solid">Heldragen</option>
              <option value="dash">Streckad</option>
              <option value="dot">Punktad</option>
            </select>
          </div>
        );
      case "Square":
        return (
          <div>
            <h2>Ritmanér yta</h2>
            <div>Linjefärg</div>
            <ColorPicker
              onChange={color => {
                console.log("Box line color", color);
              }}
            />
            <div>Fyllnadsfärg</div>
            <ColorPicker
              onChange={color => {
                console.log("Box fill color", color);
              }}
            />
            <div>Opacitet</div>
            <select
              value={this.state.boxFillOpacity}
              onChange={this.update("boxFillOpacity")}
            >
              <option value="0">0% (genomskinlig)</option>
              <option value="0.25">25%</option>
              <option value="0.5">50%</option>
              <option value="0.75">75%</option>
              <option value="1">100% (fylld)</option>
            </select>
            <div>Linjetjocklek</div>
            <select
              value={this.state.boxLineWidth}
              onChange={this.update("boxLineWidth")}
            >
              <option value="1">Tunn</option>
              <option value="3">Normal</option>
              <option value="5">Tjock</option>
              <option value="8">Tjockare</option>
            </select>
            <div>Linjestil</div>
            <select
              value={this.state.boxLineStyle}
              onChange={this.update("boxLineStyle")}
            >
              <option value="solid">Heldragen</option>
              <option value="dash">Streckad</option>
              <option value="dot">Punktad</option>
            </select>
          </div>
        );
      default:
        return <div />;
    }
  }
}

export default withStyles(styles)(Symbology);
