import React from "react";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import NativeSelect from "@mui/material/NativeSelect";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import Input from "@mui/material/Input";
import InputLabel from "@mui/material/InputLabel";
import { withSnackbar } from "notistack";
import { Typography } from "@mui/material";

const StyledButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(1),
}));

class MeasureView extends React.PureComponent {
  constructor(props) {
    super(props);
    this.model = props.model;
    this.app = props.app;
    this.localObserver = props.localObserver;
    this.state = {
      shape: this.model.getType(),
    };
  }

  handleChange = (name) => (event) => {
    this.setState({ [name]: event.target.value });
    this.model.setType(event.target.value);
  };

  render() {
    return (
      <Grid container spacing={1}>
        <Grid item xs={12}>
          <Typography variant="body1">
            Vid ritning av sträckor och arealer är det möjligt att hålla ner
            Shift-tangenten. Då kan man rita sträckan/arealen på fri hand.
            <br />
            <br />
            För att avsluta en mätning, klicka igen på sista punkten eller tryck
            på Esc-tangenten.
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel variant="standard" htmlFor="measure-native-helper">
              Typ av mätning
            </InputLabel>
            <NativeSelect
              value={this.state.shape}
              onChange={this.handleChange("shape")}
              input={<Input name="shape" id="measure-native-helper" />}
            >
              <option value="Point">Punkt</option>
              <option value="LineString">Sträcka</option>
              <option value="Circle">Cirkel</option>
              <option value="Polygon">Areal</option>
            </NativeSelect>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <StyledButton
            variant="contained"
            fullWidth
            onClick={this.model.clear}
          >
            Rensa mätning
          </StyledButton>
        </Grid>
      </Grid>
    );
  }
}

export default withSnackbar(MeasureView);
