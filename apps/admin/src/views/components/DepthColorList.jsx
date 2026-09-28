import React from "react";
import { SketchPicker } from "react-color";
import Button from "@material-ui/core/Button";
import AddIcon from "@material-ui/icons/Add";
import RemoveIcon from "@material-ui/icons/Remove";
import { withStyles } from "@material-ui/core/styles";
import { green, red } from "@material-ui/core/colors";

const ColorButtonRed = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(red[500]),
    backgroundColor: red[500],
    "&:hover": {
      backgroundColor: red[700],
    },
  },
}))(Button);

const ColorButtonGreen = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(green[700]),
    backgroundColor: green[500],
    "&:hover": {
      backgroundColor: green[700],
    },
  },
}))(Button);

const swatchStyle = {
  width: 36,
  height: 22,
  padding: 0,
  border: "1px solid #ccc",
  cursor: "pointer",
  flexShrink: 0,
};

const coverStyle = {
  position: "fixed",
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

function formatDepth(value) {
  const parsed = parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return "?";
  }
  return Number(parsed.toFixed(2)).toString();
}

function legendLabel(stops, index) {
  const current = parseFloat(stops[index].maxDepth);
  const previous =
    index === 0 ? 0 : parseFloat(stops[index - 1].maxDepth);
  const isLast = index === stops.length - 1;
  if (isLast && stops.length > 1) {
    return `> ${formatDepth(previous)} m`;
  }
  return `${formatDepth(previous)}–${formatDepth(current)} m`;
}

function depthColorWarnings(stops) {
  const warnings = [];
  stops.forEach((stop, index) => {
    const maxDepth = parseFloat(stop.maxDepth);
    if (!(maxDepth > 0)) {
      warnings.push(
        `Klass ${index + 1}: maxDepth måste vara ett tal större än 0.`
      );
    }
    if (index > 0) {
      const previous = parseFloat(stops[index - 1].maxDepth);
      if (
        Number.isFinite(maxDepth) &&
        Number.isFinite(previous) &&
        maxDepth <= previous
      ) {
        warnings.push(
          `Klass ${
            index + 1
          }: maxDepth måste vara strikt större än klassen ovanför.`
        );
      }
    }
  });
  return warnings;
}

class HexColorSwatch extends React.Component {
  constructor(props) {
    super(props);
    this.state = { open: false };
  }

  handleToggle = (event) => {
    event.preventDefault();
    if (this.props.disabled) {
      return;
    }
    this.setState((prev) => ({ open: !prev.open }));
  };

  handleClose = () => {
    this.setState({ open: false });
  };

  handleChange = (color) => {
    this.props.onChange(color.hex);
  };

  render() {
    const { color, disabled, label } = this.props;
    return (
      <div style={{ position: "relative", display: "inline-block" }}>
        <button
          type="button"
          aria-label={label}
          disabled={disabled}
          onClick={this.handleToggle}
          style={{
            ...swatchStyle,
            background: color || "#ffffff",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.5 : 1,
          }}
        />
        {this.state.open && !disabled ? (
          <div style={{ position: "absolute", zIndex: 2, top: 28 }}>
            <div style={coverStyle} onClick={this.handleClose} />
            <SketchPicker
              color={color || "#ffffff"}
              disableAlpha
              onChangeComplete={this.handleChange}
            />
          </div>
        ) : null}
      </div>
    );
  }
}

class DepthColorList extends React.Component {
  handleMaxDepthChange = (index, value) => {
    const updated = this.props.depthColors.map((stop, i) =>
      i === index ? { ...stop, maxDepth: value } : stop
    );
    this.props.onChange(updated);
  };

  handleColorChange = (index, color) => {
    const updated = this.props.depthColors.map((stop, i) =>
      i === index ? { ...stop, color } : stop
    );
    this.props.onChange(updated);
  };

  handleRemove = (index) => {
    this.props.onChange(this.props.depthColors.filter((_, i) => i !== index));
  };

  handleAdd = () => {
    const { depthColors } = this.props;
    const last = depthColors[depthColors.length - 1];
    const lastDepth = last ? parseFloat(last.maxDepth) : NaN;
    const nextDepth = Number.isFinite(lastDepth) ? lastDepth + 0.5 : 0.5;
    this.props.onChange([
      ...depthColors,
      { maxDepth: nextDepth, color: "#6baed6" },
    ]);
  };

  handleClear = () => {
    this.props.onChange([]);
  };

  render() {
    const depthColors = this.props.depthColors || [];
    const warnings = depthColorWarnings(depthColors);

    return (
      <div>
        <label className="long-label">Djupklasser</label>
        {depthColors.map((stop, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 8,
              maxWidth: 600,
            }}
          >
            <span
              style={{
                width: 110,
                marginRight: 8,
                whiteSpace: "nowrap",
              }}
            >
              {legendLabel(depthColors, index)}
            </span>
            <input
              type="text"
              inputMode="decimal"
              aria-label={`maxDepth för ${legendLabel(depthColors, index)}`}
              value={stop.maxDepth}
              onChange={(event) =>
                this.handleMaxDepthChange(index, event.target.value)
              }
              style={{ width: 80, marginRight: 8 }}
            />
            <HexColorSwatch
              color={stop.color}
              label={`Färg för ${legendLabel(depthColors, index)}`}
              onChange={(color) => this.handleColorChange(index, color)}
            />
            <ColorButtonRed
              variant="contained"
              className="btn"
              onClick={(event) => {
                event.preventDefault();
                this.handleRemove(index);
              }}
              startIcon={<RemoveIcon />}
              style={{ marginLeft: 8 }}
            >
              Ta bort
            </ColorButtonRed>
          </div>
        ))}
        <div style={{ marginTop: 8 }}>
          <ColorButtonGreen
            variant="contained"
            className="btn"
            onClick={(event) => {
              event.preventDefault();
              this.handleAdd();
            }}
            startIcon={<AddIcon />}
          >
            Lägg till djupklass
          </ColorButtonGreen>
          <ColorButtonRed
            variant="contained"
            className="btn"
            onClick={(event) => {
              event.preventDefault();
              this.handleClear();
            }}
            disabled={depthColors.length === 0}
            startIcon={<RemoveIcon />}
            style={{ marginLeft: 8 }}
          >
            Rensa alla
          </ColorButtonRed>
        </div>
        {warnings.length > 0 && (
          <div
            style={{
              marginTop: 8,
              color: "#8a6d3b",
              fontStyle: "italic",
            }}
          >
            {warnings.map((warning, index) => (
              <div key={index}>{warning}</div>
            ))}
            Klienten hoppar över ogiltiga klasser.
          </div>
        )}
      </div>
    );
  }
}

export default DepthColorList;
