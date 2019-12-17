/* OBS!

THIS VIEW IS NOT IMPLEMENTED AND NEED TO BE CLEANED AS WELL

 OBS! 
*/

import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Input from "@material-ui/core/Input";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";

const styles = theme => ({
  root: {
    display: "flex",
    flexDirection: "column",
    flexWrap: "wrap",
    minHeight: "200px",
    minWidth: "200px"
  },
  formControl: {
    margin: theme.spacing(1),
    flex: "auto",
    minWidth: 120,
    maxWidth: 300
  }
});

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250
    }
  }
};

const layers = ["Alla lager"];

function getStyles(layer, that) {
  return {
    fontWeight: that.state.layers.includes(layer) ? 5 : 4
  };
}

class SettingsMenu extends React.Component {
  state = {
    layers: []
  };
  handleChange = event => {
    this.setState({ layers: event.target.value });
  };

  handleChangeMultiple = event => {
    const { options } = event.target;
    const value = [];
    for (let i = 0, l = options.length; i < l; i += 1) {
      if (options[i].selected) {
        value.push(options[i].value);
      }
    }
    this.setState({
      layers: value
    });
  };

  render() {
    const { classes } = this.props;
    return (
      <div className={classes.root}>
        <FormControl className={classes.formControl}>
          <InputLabel htmlFor="select-multiple">Lager</InputLabel>
          <Select
            multiple
            value={this.state.layers}
            onChange={this.handleChange}
            input={<Input id="select-multiple" />}
            MenuProps={MenuProps}
          >
            {layers.map(layer => (
              <MenuItem
                key={layer}
                value={layer}
                style={getStyles(layer, this)}
              >
                {layers}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
    );
  }
}

export default withStyles(styles)(SettingsMenu);
