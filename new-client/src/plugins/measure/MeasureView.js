import React from "react";
import { withStyles } from "@material-ui/core/styles";
import PropTypes from "prop-types";
import Button from "@material-ui/core/Button";
import NativeSelect from "@material-ui/core/NativeSelect";
import FormControl from "@material-ui/core/FormControl";
import Input from "@material-ui/core/Input";
import InputLabel from "@material-ui/core/InputLabel";
import { withSnackbar } from "notistack";

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

class MeasureView extends React.PureComponent {
  state = {
    shape: "LineString"
  };

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.app = this.props.app;
    this.localObserver = this.props.localObserver;
  }

  componentDidMount() {}

  componentWillUnmount() {}

  handleChange = name => event => {
    this.setState({ [name]: event.target.value });
    this.props.model.setType(event.target.value);
  };

  render() {
    const { classes } = this.props;
    return (
      <>
        <div className={classes.row}>
          <FormControl className={classes.formControl}>
            <InputLabel htmlFor="age-native-helper">Typ av mätning</InputLabel>
            <NativeSelect
              value={this.state.age}
              onChange={this.handleChange("shape")}
              input={<Input name="shape" id="shape-native-helper" />}
            >
              <option value="LineString">Sträcka</option>
              <option value="Polygon">Areal</option>
            </NativeSelect>
          </FormControl>
        </div>
        <div className={classes.row}>
          <Button variant="contained" onClick={this.props.model.clear}>
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
