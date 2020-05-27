import React from "react";
import { Typography } from "@material-ui/core";
import Grid from "@material-ui/core/Grid";
import Popover from "@material-ui/core/Popover";
import TextField from "@material-ui/core/TextField";
import { withStyles } from "@material-ui/core/styles";

const getPopoverMenuItemTitle = label => {
  return <Typography variant="h6">{label}: </Typography>;
};

const getTextField = (value, onChangeFunction, variant) => {
  return (
    <TextField
      id="icon-picker"
      label={""}
      type="icon"
      variant={variant}
      value={value}
      onChange={onChangeFunction}
    />
  );
};

const styles = theme => ({
  test: { padding: "100px" }
});

class SettingsPopover extends React.Component {
  state = {
    color: this.props.menuItem.color,
    icon: this.props.menuItem.icon
  };

  updateColorState = e => {
    this.setState({ color: e.target.value });
  };

  updateIconState = e => {
    let value = e.target.value;
    this.setState(prevState => {
      prevState.icon.materialUiIconName = value;
      return {
        icon: prevState.icon
      };
    });
  };

  saveAndClosePopover = () => {
    const { closePopover, updateMenuItem, treeNodeId } = this.props;
    let objectWithKeyValuesToUpdate = this.state;
    updateMenuItem(treeNodeId, objectWithKeyValuesToUpdate);
    closePopover();
  };

  renderSettings = () => {
    return (
      <form
        style={{ width: "400px", height: "350px" }}
        noValidate
        autoComplete="off"
      >
        <Grid container>
          <Grid xs={12} item>
            {getPopoverMenuItemTitle("Ikon")}
            {getTextField(
              this.state.icon.materialUiIconName,
              this.updateIconState,
              "standard"
            )}
          </Grid>
          <Grid xs={12} item>
            {getPopoverMenuItemTitle("Färg")}
            {getTextField(this.state.color, this.updateColorState, "standard")}
          </Grid>
        </Grid>
      </form>
    );
  };

  render = () => {
    const { anchorEl, open } = this.props;
    return (
      <>
        <Popover
          open={open}
          onClose={this.saveAndClosePopover}
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right"
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "left"
          }}
        >
          {this.renderSettings()}
        </Popover>
      </>
    );
  };
}

export default withStyles(styles)(SettingsPopover);
