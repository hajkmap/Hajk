import React, { useEffect, useState, useCallback } from "react";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import { NumericFormat } from "react-number-format";
import { transform } from "ol/proj";
import { useSnackbar } from "notistack";
import { Grid, IconButton } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { styled } from "@mui/material/styles";
import HajkToolTip from "components/HajkToolTip";

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  justifyContent: "flex-end",
  padding: "8px",
  "& svg": {
    fontSize: 20,
  },
  marginBottom: "-8px",
  marginRight: "-6px",
}));

const CoordinatesTransformRow = (props) => {
  const [errorX, setErrorX] = useState("");
  const [errorY, setErrorY] = useState("");
  const [coordinateX, setCoordinateX] = useState("");
  const [coordinateY, setCoordinateY] = useState("");
  const [coordinateXFloat, setCoordinateXFloat] = useState(0);
  const [coordinateYFloat, setCoordinateYFloat] = useState(0);
  const [wasLastChanged, setWasLastChanged] = useState(false);
  const [wasModified, setWasModified] = useState(false);

  const { enqueueSnackbar } = useSnackbar();
  const { model, transformation, inverseAxis } = props;
  const localObserver = model.localObserver;

  const subscribeToLocalObserver = useCallback(() => {
    const newCoordinatesHandler = (incomingCoords) => {
      if (
        incomingCoords["proj"] !== transformation.code ||
        incomingCoords["force"]
      ) {
        const transformedCoords = transform(
          incomingCoords["coordinates"],
          incomingCoords["proj"],
          transformation.code
        );
        setCoordinateX(transformedCoords[0].toFixed(transformation.precision));
        setCoordinateY(transformedCoords[1].toFixed(transformation.precision));
        setCoordinateXFloat(transformedCoords[0]);
        setCoordinateYFloat(transformedCoords[1]);
        setErrorX("");
        setErrorY("");
        setWasLastChanged(false);
        setWasModified(true);
      } else {
        setWasLastChanged(true);
        setWasModified(true);
      }
    };

    const resetCoordinatesHandler = () => {
      setCoordinateX("");
      setCoordinateY("");
      setCoordinateXFloat(0);
      setCoordinateYFloat(0);
      setErrorX("");
      setErrorY("");
    };

    localObserver.subscribe("newCoordinates", newCoordinatesHandler);
    localObserver.subscribe("resetCoordinates", resetCoordinatesHandler);

    return () => {
      localObserver.unsubscribe("newCoordinates", newCoordinatesHandler);
      localObserver.unsubscribe("resetCoordinates", resetCoordinatesHandler);
    };
  }, [localObserver, transformation.code, transformation.precision]);

  useEffect(() => {
    subscribeToLocalObserver();
  }, [subscribeToLocalObserver]);

  const getCoordinates = (title) => {
    let inputX = document.getElementsByName(`${title}numberformatX`)[0].value;
    let inputY = document.getElementsByName(`${title}numberformatY`)[0].value;
    inputX = inputX.replace(/\s/g, "");
    inputY = inputY.replace(/\s/g, "");
    return { inputX, inputY };
  };

  const handleCopyToClipBoard = (coordinateFormatTitle) => {
    const { inputX, inputY } = getCoordinates(coordinateFormatTitle);
    if (inputX === "" || inputY === "") {
      enqueueSnackbar(
        "Kopiering misslyckades, båda fälten måste vara ifyllda",
        { variant: "error" }
      );
      return;
    }
    const coordinatesString = `${inputX},${inputY}`;
    navigator.clipboard
      .writeText(coordinatesString)
      .then(() => {
        enqueueSnackbar("Koordinaten kopierades till urklipp", {
          variant: "info",
        });
      })
      .catch(() => {
        enqueueSnackbar("Kopiering misslyckades", { variant: "error" });
      });
  };

  const formatValue = (value) => {
    const floatValue = parseFloat(value.replace(/ /g, "").replace(",", "."));
    return {
      formattedValue: new Intl.NumberFormat().format(floatValue),
      value: value.replace(/ /g, ""),
      floatValue,
    };
  };

  const handlePasteFromClipBoard = (event) => {
    const clipboardData = event.clipboardData || window.clipboardData;
    const pastedText = clipboardData.getData("text");
    if (!pastedText.includes(",")) return;
    event.preventDefault();
    const [xValue, yValue] = pastedText.split(",");
    const xObject = inverseAxis ? formatValue(yValue) : formatValue(xValue);
    const yObject = inverseAxis ? formatValue(xValue) : formatValue(yValue);
    setCoordinateX(xObject.value);
    setCoordinateXFloat(xObject.floatValue);
    setCoordinateY(yObject.value);
    setCoordinateYFloat(yObject.floatValue);
    setWasModified(true);
    localObserver.publish("newCoordinates", {
      coordinates: [xObject.floatValue, yObject.floatValue],
      proj: transformation.code,
      force: false,
    });
  };

  const handleInputX = (event) => {
    if (
      (!inverseAxis && event.value === coordinateX) ||
      (inverseAxis && event.value === coordinateY)
    )
      return;

    const newCoordinateX = !inverseAxis ? event.value : coordinateY;
    const newCoordinateXFloat = !inverseAxis
      ? event.floatValue
      : coordinateYFloat;
    const newCoordinateY = !inverseAxis ? coordinateY : event.value;
    const newCoordinateYFloat = !inverseAxis
      ? coordinateYFloat
      : event.floatValue;

    if (!inverseAxis) {
      setCoordinateX(newCoordinateX);
      setCoordinateXFloat(newCoordinateXFloat);
    } else {
      setCoordinateY(newCoordinateY);
      setCoordinateYFloat(newCoordinateYFloat);
    }
    setWasModified(true);

    if (isNaN(event.floatValue) || !isFinite(event.floatValue)) {
      setErrorX("Ange ett decimaltal");
    } else {
      setErrorX("");
      localObserver.publish("newCoordinates", {
        coordinates: [newCoordinateXFloat, newCoordinateYFloat],
        proj: transformation.code,
        force: false,
      });
    }
  };

  const handleInputY = (event) => {
    if (
      (!inverseAxis && event.value === coordinateY) ||
      (inverseAxis && event.value === coordinateX)
    )
      return;

    const newCoordinateY = !inverseAxis ? event.value : coordinateX;
    const newCoordinateYFloat = !inverseAxis
      ? event.floatValue
      : coordinateXFloat;
    const newCoordinateX = !inverseAxis ? coordinateX : event.value;
    const newCoordinateXFloat = !inverseAxis
      ? coordinateXFloat
      : event.floatValue;

    if (!inverseAxis) {
      setCoordinateY(newCoordinateY);
      setCoordinateYFloat(newCoordinateYFloat);
    } else {
      setCoordinateX(newCoordinateX);
      setCoordinateXFloat(newCoordinateXFloat);
    }
    setWasModified(true);

    if (isNaN(event.floatValue) || !isFinite(event.floatValue)) {
      setErrorY("Ange ett decimaltal");
    } else {
      setErrorY("");
      localObserver.publish("newCoordinates", {
        coordinates: [newCoordinateXFloat, newCoordinateYFloat],
        proj: transformation.code,
        force: false,
      });
    }
  };

  let xCoord = inverseAxis ? coordinateY : coordinateX;
  let yCoord = inverseAxis ? coordinateX : coordinateY;

  if (model.showFieldsOnStart || wasModified) {
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
            {transformation
              ? `${transformation.title} (${transformation.code})`
              : ""}
          </Typography>
        </Grid>
        <Grid container item xs={2} md={4} justifyContent={"end"}>
          <HajkToolTip title="Kopiera till urklipp">
            <StyledIconButton
              onClick={() => handleCopyToClipBoard(transformation.title)}
            >
              <ContentCopyIcon />
            </StyledIconButton>
          </HajkToolTip>
        </Grid>
        <Grid item xs={12} md={6}>
          <NumericFormat
            label={transformation.xtitle}
            margin="dense"
            variant="outlined"
            size="small"
            value={xCoord}
            name={`${transformation.title}numberformatX`}
            type="text"
            onValueChange={(values) => handleInputX(values)}
            axis={transformation.inverseAxis ? "X" : "Y"}
            error={errorX !== ""}
            helperText={errorX}
            thousandSeparator={model.thousandSeparator ? " " : false}
            customInput={TextField}
            fullWidth={true}
            onPaste={(values) => handlePasteFromClipBoard(values)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <NumericFormat
            label={transformation.ytitle}
            margin="dense"
            size="small"
            variant="outlined"
            value={yCoord}
            name={`${transformation.title}numberformatY`}
            type="text"
            onValueChange={(values) => handleInputY(values)}
            axis={transformation.inverseAxis ? "Y" : "X"}
            error={errorY !== ""}
            helperText={errorY}
            thousandSeparator={model.thousandSeparator ? " " : false}
            customInput={TextField}
            fullWidth={true}
            onPaste={(values) => handlePasteFromClipBoard(values)}
          />
        </Grid>
      </Grid>
    );
  } else {
    return <></>;
  }
};

export default CoordinatesTransformRow;
