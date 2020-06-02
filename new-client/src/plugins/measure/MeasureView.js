import React from "react";
import { withStyles } from "@material-ui/core/styles";
import PropTypes from "prop-types";
import Button from "@material-ui/core/Button";
import NativeSelect from "@material-ui/core/NativeSelect";
import FormControl from "@material-ui/core/FormControl";
import Input from "@material-ui/core/Input";
import InputLabel from "@material-ui/core/InputLabel";
import { withSnackbar } from "notistack";
import { Typography } from "@material-ui/core";

const styles = theme => ({
  root: {
    display: "flex",
    flexWrap: "wrap"
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120
  },
  selectEmpty: {
    marginTop: theme.spacing(2)
  },
  row: {
    marginBottom: theme.spacing(1)
  }
});

class MeasureView extends React.PureComponent {
  constructor(props) {
    super(props);
    this.model = props.model;
    this.app = props.app;
    this.localObserver = props.localObserver;
    this.state = {
      shape: this.model.getType()
    };
  }

  handleChange = name => event => {
    this.setState({ [name]: event.target.value });
    this.model.setType(event.target.value);
  };

  render() {
    const { classes } = this.props;
    return (
      <>
        <div className={classes.row}>
          <Typography variant="body1">
            Vid ritning av sträckor och arealer är det möjligt att hålla ner
            Shift-tangenten. Då kan man rita sträckan/arealen på fri hand.
            <br />
            <br />
            För att avsluta en mätning, klicka igen på sista punkten eller tryck
            på Esc-tangenten.
          </Typography>
          <FormControl className={classes.formControl}>
            <InputLabel>Typ av mätning</InputLabel>
            <NativeSelect
              value={this.state.shape}
              onChange={this.handleChange("shape")}
              input={<Input name="shape" id="shape-native-helper" />}
            >
              <option value="Point">Punkt</option>
              <option value="LineString">Sträcka</option>
              <option value="Circle">Cirkel</option>
              <option value="Polygon">Areal</option>
            </NativeSelect>
          </FormControl>
        </div>
        <div className={classes.row}>
          <Button variant="contained" onClick={this.model.clear}>
            Rensa mätning
          </Button>
        </div>
      </>
    );
  }
}

MeasureView.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(withSnackbar(MeasureView));
