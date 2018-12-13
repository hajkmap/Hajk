import React from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import PropTypes from "prop-types";
import Button from "@material-ui/core/Button";
import DeleteIcon from "@material-ui/icons/Delete";
import NativeSelect from "@material-ui/core/NativeSelect";
import FormControl from "@material-ui/core/FormControl";
import Input from "@material-ui/core/Input";
import InputLabel from "@material-ui/core/InputLabel";
import { withSnackbar } from "notistack";
import Dialog from "../../components/Dialog.js";
import Symbology from "./components/Symbology.js";

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

class DrawView extends React.PureComponent {
  state = {
    shape: "LineString"
  };

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.app = this.props.app;
    this.localObserver = this.props.localObserver;
    this.localObserver.on("dialog", feature => {
      this.setState({
        dialog: true,
        feature: feature
      });
    });
  }

  componentDidMount() {}

  componentWillUnmount() {}

  handleChange = name => event => {
    this.setState({ [name]: event.target.value });
    this.props.model.setType(event.target.value);
  };

  onClose = text => {
    this.state.feature.set("type", "Label");
    this.state.feature.set("text", text);
    this.setState({
      dialog: false
    });
    this.props.model.redraw();
  };

  renderDialog() {
    if (this.state.dialog) {
      return createPortal(
        <Dialog
          options={{
            text: "",
            prompt: true,
            headerText: "Ange text",
            buttonText: "OK"
          }}
          open={this.state.dialog}
          onClose={this.onClose}
        />,
        document.getElementById("map")
      );
    } else {
      return null;
    }
  }

  render() {
    const { classes } = this.props;
    return (
      <>
        <div className={classes.row}>
          <FormControl className={classes.formControl}>
            <InputLabel htmlFor="age-native-helper">
              Typ av ritobjekt
            </InputLabel>
            <NativeSelect
              value={this.state.age}
              onChange={this.handleChange("shape")}
              input={<Input name="shape" id="shape-native-helper" />}
            >
              <option value="LineString">Linje</option>
              <option value="Text">Text</option>
              <option value="Polygon">Yta</option>
              <option value="Square">Rektangel</option>
              <option value="Circle">Cirkel</option>
              <option value="Point">Punkt</option>
            </NativeSelect>
          </FormControl>
        </div>
        <div className={classes.row}>
          <Button variant="contained" onClick={this.props.model.clear}>
            <DeleteIcon />
            Ta bort alla ritobjekt
          </Button>
        </div>
        <div className={classes.row}>
          <Symbology type={this.state.shape} model={this.props.model} />
        </div>
        {this.renderDialog()}
      </>
    );
  }
}

DrawView.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(withSnackbar(DrawView));
