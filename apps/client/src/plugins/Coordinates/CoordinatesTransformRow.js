import React from "react";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import { NumericFormat } from "react-number-format";
import { transform } from "ol/proj";
import { withSnackbar } from "notistack";
import { Grid, IconButton } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { styled } from "@mui/material/styles";
import HajkToolTip from "components/HajkToolTip";

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  justifyContent: "flex-end",
  padding: "8px",
  "& svg": {
    fontSize: 20, // Adjust the icon size here
  },
  marginBottom: "-8px",
  marginRight: "-6px",
}));

class CoordinatesTransformRow extends React.PureComponent {
  state = {
    errorX: "",
    errorY: "",
    coordinateX: "",
    coordinateY: "",
    coordinateXFloat: 0,
    coordinateYFloat: 0,
    wasLastChanged: false,
    wasModified: false,
    wasPasted: false,
  };

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.transformation = this.props.transformation;
    this.localObserver = this.props.model.localObserver;

    this.localObserver.subscribe("newCoordinates", (incomingCoords) => {
      // Force a change if the new coords from map click or user location since
      // there might be a transformation with the same code as on the map
      if (
        incomingCoords["proj"] !== this.transformation.code ||
        incomingCoords["force"]
      ) {
        const transformedCoords = transform(
          incomingCoords["coordinates"],
          incomingCoords["proj"],
          this.props.transformation.code
        );
        this.setState({
          errorX: "",
          errorY: "",
          wasModified: true,
          coordinateX: transformedCoords[0].toFixed(
            this.transformation.precision
          ),
          coordinateY: transformedCoords[1].toFixed(
            this.transformation.precision
          ),
          coordinateXFloat: transformedCoords[0],
          coordinateYFloat: transformedCoords[1],
          wasLastChanged: false,
        });
      } else {
        this.setState({ wasLastChanged: true, wasModified: true });
      }
    });

    this.localObserver.subscribe("resetCoordinates", () => {
      this.setState({
        errorX: "",
        errorY: "",
        coordinateX: "",
        coordinateY: "",
        coordinateXFloat: 0,
        coordinateYFloat: 0,
      });
    });
  }

  getCoordinates(title) {
    let inputX, inputY;
    // We find the specified numericFormat X and Y value
    inputX = document.getElementsByName(`${title}numberformatX`)[0].value;
    inputY = document.getElementsByName(`${title}numberformatY`)[0].value;
    // And remove all blank spaces
    inputX = inputX.replace(/\s/g, "");
    inputY = inputY.replace(/\s/g, "");

    return { inputX, inputY };
  }

  handleCopyToClipBoard(coordinateFormatTitle) {
    //We get the correct input fields values using the title of the coordinate system
    const { inputX, inputY } = this.getCoordinates(coordinateFormatTitle);

    // We check if the values have any numbers, and if not exit the function early...
    // and give an alert to the user
    if (inputX === "" || inputY === "") {
      // Display a message if any of the fields are empty
      this.props.enqueueSnackbar("Kopiering misslyckades, fälten är tomma", {
        variant: "error",
      });
      return;
    }

    // Set the string to be copied from the two X and Y values
    const coordinatesString = `${inputX},${inputY}`;

    // We create a temporary element to store the and copy the coordinateString
    const input = document.createElement("input");
    input.value = coordinatesString;

    // Make the element non-interactive and hide it
    input.setAttribute("readonly", "");
    input.style.position = "absolute";
    input.style.left = "-9999px";

    // We copy the string from the element, alert the user of successful copying...
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy") &&
      this.props.enqueueSnackbar("Koordinaten kopierades till urklipp", {
        variant: "info",
      });
    // and then remove the element
    document.body.removeChild(input);
  }

  handlePasteFromClipBoard(event) {
    const clipboardData = event.clipboardData || window.clipboardData;
    const pastedText = clipboardData.getData("text");

    // If pasted text does not have a comma, we don't need to handle double inputs
    // we therefore exit the function is that is the case.
    if (!pastedText.includes(",")) {
      return;
    }

    // We don't want to paste twice
    event.preventDefault();

    // Here we set the X and Y coordinate object depending on the inverse axis...
    // inverse axis is true for the first two numeric inputs and false for the third
    const [xValue, yValue] = pastedText.split(",");
    const formatValue = (value) => {
      const floatValue = parseFloat(value.replace(/ /g, "").replace(",", "."));
      return {
        formattedValue: new Intl.NumberFormat().format(floatValue),
        value: value.replace(/ /g, ""),
        floatValue,
      };
    };
    const xObject = this.props.inverseAxis
      ? formatValue(yValue)
      : formatValue(xValue);
    const yObject = this.props.inverseAxis
      ? formatValue(xValue)
      : formatValue(yValue);

    // We update  the state
    this.setState({
      coordinateX: xObject.value,
      coordinateXFloat: xObject.floatValue,
      coordinateY: yObject.value,
      coordinateYFloat: yObject.floatValue,
      wasModified: true,
    });

    // And the local observer
    this.localObserver.publish("newCoordinates", {
      coordinates: [xObject.floatValue, yObject.floatValue],
      proj: this.props.transformation.code,
      force: false,
    });
  }

  handleInputX(event) {
    if (
      (!this.props.inverseAxis && event.value === this.state.coordinateX) ||
      (this.props.inverseAxis && event.value === this.state.coordinateY)
    ) {
      // Nothing was changed so do nothing, this happens since the value is
      // changed multiple times during formatting and we do not want to create
      // infinite loops
      return;
    }

    if (!this.props.inverseAxis) {
      // Validate that the changed data is a finite number
      this.setState({
        coordinateX: event.value,
        coordinateXFloat: event.floatValue,
        wasModified: true,
      });
    } else {
      this.setState({
        coordinateY: event.value,
        coordinateYFloat: event.floatValue,
        wasModified: true,
      });
    }
    if (isNaN(event.floatValue) || !isFinite(event.floatValue)) {
      this.setState({ errorX: "Ange ett decimaltal" });
    } else {
      this.setState({ errorX: "" });
      const updatedValue = event.floatValue;

      if (!this.props.inverseAxis) {
        // publish the new value so all other transformations and the marker is updated
        this.localObserver.publish("newCoordinates", {
          coordinates: [updatedValue, this.state.coordinateYFloat],
          proj: this.props.transformation.code,
          force: false,
        });
      } else {
        // publish the new value so all other transformations and the marker is updated
        this.localObserver.publish("newCoordinates", {
          coordinates: [this.state.coordinateXFloat, updatedValue],
          proj: this.props.transformation.code,
          force: false,
        });
      }
    }
  }

  handleInputY(event) {
    if (
      (!this.props.inverseAxis && event.value === this.state.coordinateY) ||
      (this.props.inverseAxis && event.value === this.state.coordinateX)
    ) {
      // Nothing was changed so do nothing, this happens since the value is
      // changed multiple times during formatting and we do not want to create
      // infinite loops
      return;
    }
    if (!this.props.inverseAxis) {
      // Validate that the changed data is a finite number
      this.setState({
        coordinateY: event.value,
        coordinateYFloat: event.floatValue,
        wasModified: true,
      });
    } else {
      this.setState({
        coordinateX: event.value,
        coordinateXFloat: event.floatValue,
        wasModified: true,
      });
    }
    if (isNaN(event.floatValue) || !isFinite(event.floatValue)) {
      this.setState({ errorY: "Ange ett decimaltal" });
    } else {
      this.setState({ errorY: "" });
      const updatedValue = event.floatValue;

      if (!this.props.inverseAxis) {
        // publish the new value so all other transformations and the marker is updated
        this.localObserver.publish("newCoordinates", {
          coordinates: [this.state.coordinateXFloat, updatedValue],
          proj: this.props.transformation.code,
          force: false,
        });
      } else {
        // publish the new value so all other transformations and the marker is updated
        this.localObserver.publish("newCoordinates", {
          coordinates: [updatedValue, this.state.coordinateYFloat],
          proj: this.props.transformation.code,
          force: false,
        });
      }
    }
  }

  componentWillUnmount() {}

  render() {
    let xCoord = this.props.inverseAxis
      ? this.state.coordinateY
      : this.state.coordinateX;
    let yCoord = this.props.inverseAxis
      ? this.state.coordinateX
      : this.state.coordinateY;

    if (this.model.showFieldsOnStart || this.state.wasModified) {
      return (
        <Grid
          container
          rowSpacing={0.5}
          columnSpacing={2}
          padding={0}
          marginLeft={"-7px"}
          paddingTop={1}
        >
          <Grid item xs={10} md={8} alignSelf={"end"}>
            <Typography variant="body2" style={{ fontWeight: 600 }}>
              {this.transformation
                ? this.transformation.title +
                  " (" +
                  this.transformation.code +
                  ")"
                : ""}
            </Typography>
          </Grid>
          <Grid container item xs={2} md={4} justifyContent={"end"}>
            <HajkToolTip title="Kopiera till urklipp">
              <StyledIconButton
                onClick={() => {
                  this.handleCopyToClipBoard(this.props.transformation.title);
                }}
              >
                <ContentCopyIcon></ContentCopyIcon>
              </StyledIconButton>
            </HajkToolTip>
          </Grid>
          <Grid item xs={12} md={6}>
            <NumericFormat
              label={this.props.transformation.xtitle}
              margin="dense"
              variant="outlined"
              size="small"
              value={xCoord}
              name={`${this.props.transformation.title}numberformatX`}
              type="text"
              onValueChange={(values) => {
                this.handleInputX(values);
              }}
              axis={this.props.transformation.inverseAxis ? "X" : "Y"}
              error={this.state.errorX !== ""}
              helperText={this.state.errorX}
              thousandSeparator={this.model.thousandSeparator ? " " : false}
              customInput={TextField}
              fullWidth={true}
              onPaste={(values) => {
                this.handlePasteFromClipBoard(values);
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <NumericFormat
              label={this.props.transformation.ytitle}
              margin="dense"
              size="small"
              variant="outlined"
              value={yCoord}
              name={`${this.props.transformation.title}numberformatY`}
              type="text"
              onValueChange={(values) => {
                this.handleInputY(values);
              }}
              axis={this.props.transformation.inverseAxis ? "Y" : "X"}
              error={this.state.errorY !== ""}
              helperText={this.state.errorY}
              thousandSeparator={this.model.thousandSeparator ? " " : false}
              customInput={TextField}
              fullWidth={true}
              onPaste={(values) => {
                this.handlePasteFromClipBoard(values);
              }}
            />
          </Grid>
        </Grid>
      );
    } else {
      return <></>;
    }
  }
}

export default withSnackbar(CoordinatesTransformRow);
