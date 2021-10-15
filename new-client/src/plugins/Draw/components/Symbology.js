import React from "react";
import { styled } from "@mui/material/styles";
import { CompactPicker as ColorPicker } from "react-color";
import NativeSelect from "@mui/material/NativeSelect";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Input from "@mui/material/Input";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  width: "100%",
  marginBottom: theme.spacing(1),
}));

const Row = styled("div")(({ theme }) => ({
  width: "100%",
  marginBottom: theme.spacing(1),
}));

class Symbology extends React.PureComponent {
  state = {
    shape: "LineString",
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
      pointSettings: model.pointSettings,
    });
  }

  update = (prop) => (e) => {
    var value = e.hex ? e.hex : e.target.value,
      state = {};

    if (e.target && e.target.type === "checkbox") {
      value = e.target.checked;
    }

    if (typeof value === "string") {
      value = !Number.isNaN(parseFloat(value))
        ? parseFloat(value)
        : !Number.isNaN(parseInt(value))
        ? parseInt(value)
        : value;
    }
    state[prop] = value;
    this.setState(state);
    this.props.model[prop] = value;
  };

  renderPointSettings() {
    switch (this.state.pointSettings) {
      case "point":
        return (
          <Row>
            <StyledFormControl>
              <div>Färg</div>
              <ColorPicker
                color={this.state.pointColor}
                onChange={this.update("pointColor")}
              />
            </StyledFormControl>
            <StyledFormControl>
              <InputLabel variant="standard">Storlek</InputLabel>
              <NativeSelect
                value={this.state.pointRadius}
                onChange={this.update("pointRadius")}
              >
                <option value="4">Liten</option>
                <option value="7">Normal</option>
                <option value="14">Stor</option>
                <option value="20">Större</option>
              </NativeSelect>
            </StyledFormControl>
          </Row>
        );
      case "symbol":
        return <Row>Val av ikon är ännu inte tillgängligt.</Row>;
      default:
        return undefined;
    }
  }

  render() {
    const { type } = this.props;
    switch (type) {
      case "Text":
        if (this.state.fontStroke === undefined) {
          return <Row />;
        }
        return (
          <div>
            <Row>
              <StyledFormControl>
                <InputLabel variant="standard">Textstorlek</InputLabel>
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
              </StyledFormControl>
            </Row>
            <Row>
              <StyledFormControl>
                <div>Textfärg</div>
                <ColorPicker
                  color={this.state.fontTextColor}
                  onChange={this.update("fontTextColor")}
                />
              </StyledFormControl>
            </Row>
            <Row>
              <StyledFormControl>
                <div>Bakgrundsfärg text</div>
                <ColorPicker
                  color={this.state.fontBackColor}
                  onChange={this.update("fontBackColor")}
                />
              </StyledFormControl>
            </Row>
            <Row>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={this.state.fontStroke}
                    onChange={this.update("fontStroke")}
                    color="primary"
                  />
                }
                label="Ingen bakgrundsfärg"
              />
            </Row>
          </div>
        );
      case "Point":
        return (
          <div>
            <StyledFormControl>
              <InputLabel variant="standard">Välj typ</InputLabel>
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
            </StyledFormControl>
            {this.renderPointSettings()}
          </div>
        );
      case "LineString":
        return (
          <div>
            <StyledFormControl>
              <div>Färg</div>
              <ColorPicker
                color={this.state.lineColor}
                onChange={this.update("lineColor")}
              />
            </StyledFormControl>
            <StyledFormControl>
              <InputLabel variant="standard">Tjocklek</InputLabel>
              <NativeSelect
                value={this.state.lineWidth}
                onChange={this.update("lineWidth")}
              >
                <option value="1">Tunn</option>
                <option value="3">Normal</option>
                <option value="5">Tjock</option>
                <option value="8">Tjockare</option>
              </NativeSelect>
            </StyledFormControl>
            <StyledFormControl>
              <InputLabel variant="standard">Stil</InputLabel>
              <NativeSelect
                value={this.state.lineStyle}
                onChange={this.update("lineStyle")}
              >
                <option value="solid">Heldragen</option>
                <option value="dash">Streckad</option>
                <option value="dot">Punktad</option>
              </NativeSelect>
            </StyledFormControl>
          </div>
        );
      case "Circle":
        if (this.state.circleRadius === undefined) {
          return <div />;
        }
        return (
          <div>
            <StyledFormControl>
              <InputLabel variant="standard">Ange radie: </InputLabel>
              <Input
                type="text"
                value={this.state.circleRadius}
                onChange={this.update("circleRadius")}
              />
            </StyledFormControl>
            <StyledFormControl>
              <div>Linjefärg</div>
              <ColorPicker
                color={this.state.circleLineColor}
                onChange={this.update("circleLineColor")}
              />
            </StyledFormControl>
            <StyledFormControl>
              <div>Fyllnadsfärg</div>
              <ColorPicker
                color={this.state.circleFillColor}
                onChange={this.update("circleFillColor")}
              />
            </StyledFormControl>
            <StyledFormControl>
              <InputLabel variant="standard">Opacitet</InputLabel>
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
            </StyledFormControl>
            <StyledFormControl>
              <InputLabel variant="standard">Linjetjocklek</InputLabel>
              <NativeSelect
                value={this.state.circleLineWidth}
                onChange={this.update("circleLineWidth")}
              >
                <option value="1">Tunn</option>
                <option value="3">Normal</option>
                <option value="5">Tjock</option>
                <option value="8">Tjockare</option>
              </NativeSelect>
            </StyledFormControl>
            <StyledFormControl>
              <InputLabel variant="standard">Linjestil</InputLabel>
              <NativeSelect
                value={this.state.circleLineStyle}
                onChange={this.update("circleLineStyle")}
              >
                <option value="solid">Heldragen</option>
                <option value="dash">Streckad</option>
                <option value="dot">Punktad</option>
              </NativeSelect>
            </StyledFormControl>
          </div>
        );
      case "Polygon":
        return (
          <div>
            <StyledFormControl>
              <div>Linjefärg</div>
              <ColorPicker
                color={this.state.polygonLineColor}
                onChange={this.update("polygonLineColor")}
              />
            </StyledFormControl>
            <StyledFormControl>
              <div>Fyllnadsfärg</div>
              <ColorPicker
                color={this.state.polygonFillColor}
                onChange={this.update("polygonFillColor")}
              />
            </StyledFormControl>
            <StyledFormControl>
              <InputLabel variant="standard">Opacitet</InputLabel>
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
            </StyledFormControl>
            <StyledFormControl>
              <InputLabel variant="standard">Linjetjocklek</InputLabel>
              <NativeSelect
                value={this.state.polygonLineWidth}
                onChange={this.update("polygonLineWidth")}
              >
                <option value="1">Tunn</option>
                <option value="3">Normal</option>
                <option value="5">Tjock</option>
                <option value="8">Tjockare</option>
              </NativeSelect>
            </StyledFormControl>
            <StyledFormControl>
              <InputLabel variant="standard">Linjestil</InputLabel>
              <NativeSelect
                value={this.state.polygonLineStyle}
                onChange={this.update("polygonLineStyle")}
              >
                <option value="solid">Heldragen</option>
                <option value="dash">Streckad</option>
                <option value="dot">Punktad</option>
              </NativeSelect>
            </StyledFormControl>
          </div>
        );
      case "Square":
        return (
          <div>
            <StyledFormControl>
              <div>Linjefärg</div>
              <ColorPicker
                color={this.state.squareLineColor}
                onChange={this.update("squareLineColor")}
              />
            </StyledFormControl>
            <StyledFormControl>
              <div>Fyllnadsfärg</div>
              <ColorPicker
                color={this.state.squareFillColor}
                onChange={this.update("squareFillColor")}
              />
            </StyledFormControl>
            <StyledFormControl>
              <InputLabel variant="standard">Opacitet</InputLabel>
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
            </StyledFormControl>
            <StyledFormControl>
              <InputLabel variant="standard">Linjetjocklek</InputLabel>
              <NativeSelect
                value={this.state.squareLineWidth}
                onChange={this.update("squareLineWidth")}
              >
                <option value="1">Tunn</option>
                <option value="3">Normal</option>
                <option value="5">Tjock</option>
                <option value="8">Tjockare</option>
              </NativeSelect>
            </StyledFormControl>
            <StyledFormControl>
              <InputLabel variant="standard">Linjestil</InputLabel>
              <NativeSelect
                value={this.state.squareLineStyle}
                onChange={this.update("squareLineStyle")}
              >
                <option value="solid">Heldragen</option>
                <option value="dash">Streckad</option>
                <option value="dot">Punktad</option>
              </NativeSelect>
            </StyledFormControl>
          </div>
        );
      default:
        return <div />;
    }
  }
}

export default Symbology;
