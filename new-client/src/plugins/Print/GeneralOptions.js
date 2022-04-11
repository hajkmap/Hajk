import React from "react";
import Grid from "@mui/material/Grid";
import { styled } from "@mui/material/styles";
import { withSnackbar } from "notistack";
import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";

const Root = styled(Grid)(() => ({
  display: "flex",
  flexWrap: "wrap",
}));

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  margin: theme.spacing(1),
  width: "100%",
}));

class GeneralOptions extends React.PureComponent {
  state = {
    anchorEl: null,
  };

  // Default colors for color picker used to set text color (used in map title, scale, etc)
  mapTextAvailableColors = [
    "#FFFFFF",
    "#D0021B",
    "#F5A623",
    "#F8E71C",
    "#8B572A",
    "#7ED321",
    "#417505",
    "#9013FE",
    "#4A90E2",
    "#50E3C2",
    "#B8E986",
    "#000000",
    "#4A4A4A",
    "#9B9B9B",
  ];

  render() {
    const {
      useMargin,
      orientation,
      format,
      scale,
      scales,
      handleChange,
      model,
      saveAsType,
      printOptionsOk,
    } = this.props;
    return (
      <>
        <Root>
          <StyledFormControl>
            <InputLabel variant="standard" htmlFor="format">
              Format
            </InputLabel>
            <Select
              variant="standard"
              value={format}
              onChange={handleChange}
              inputProps={{
                name: "format",
                id: "format",
              }}
            >
              {this.props.options.paperFormats.map((value, index) => {
                return (
                  <MenuItem key={"paperFormat_" + index} value={value}>
                    {value.toUpperCase()}
                  </MenuItem>
                );
              })}
            </Select>
          </StyledFormControl>
          <StyledFormControl>
            <InputLabel variant="standard" htmlFor="useMargin">
              Marginaler runt kartbilden
            </InputLabel>
            <Select
              variant="standard"
              value={useMargin}
              onChange={handleChange}
              inputProps={{
                name: "useMargin",
                id: "useMargin",
              }}
            >
              <MenuItem value={true}>Ja</MenuItem>
              <MenuItem value={false}>Nej</MenuItem>
            </Select>
          </StyledFormControl>
          <StyledFormControl>
            <InputLabel variant="standard" htmlFor="orientation">
              Orientering
            </InputLabel>
            <Select
              variant="standard"
              value={orientation}
              onChange={handleChange}
              inputProps={{
                name: "orientation",
                id: "orientation",
              }}
            >
              <MenuItem value={"landscape"}>Liggande</MenuItem>
              <MenuItem value={"portrait"}>Stående</MenuItem>
            </Select>
          </StyledFormControl>

          <StyledFormControl error={!printOptionsOk}>
            <InputLabel variant="standard" htmlFor="scale">
              Skala
            </InputLabel>
            <Select
              variant="standard"
              value={scale}
              onChange={handleChange}
              inputProps={{
                name: "scale",
                id: "scale",
              }}
            >
              {scales.map((scale, i) => {
                // Note: it is crucial to keep the scale value (in state) divided by 1000 from what is shown to user!
                return (
                  <MenuItem key={i} value={scale}>
                    {model.getUserFriendlyScale(scale)}
                  </MenuItem>
                );
              })}
            </Select>
            {!printOptionsOk && (
              <FormHelperText>
                Bilden kommer inte kunna skrivas ut korrekt. Testa med en lägre
                upplösning eller mindre skala.
              </FormHelperText>
            )}
          </StyledFormControl>
          <StyledFormControl>
            <InputLabel variant="standard" htmlFor="orientation">
              Spara som
            </InputLabel>
            <Select
              variant="standard"
              value={saveAsType}
              onChange={handleChange}
              inputProps={{
                name: "saveAsType",
                id: "saveAsType",
              }}
            >
              <MenuItem value={"PDF"}>PDF</MenuItem>
              <MenuItem value={"PNG"}>PNG</MenuItem>
            </Select>
          </StyledFormControl>
        </Root>
      </>
    );
  }
}

export default withSnackbar(GeneralOptions);
