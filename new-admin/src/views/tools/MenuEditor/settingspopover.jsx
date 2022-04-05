import React from "react";
import { Typography } from "@material-ui/core";
import Grid from "@material-ui/core/Grid";
import Popover from "@material-ui/core/Popover";
import TextField from "@material-ui/core/TextField";
import { withStyles } from "@material-ui/core/styles";
import { SketchPicker } from "react-color";
import Link from "@material-ui/core/Link";
import { ColorButtonGreen, ColorButtonRed } from "./custombuttons";
import Checkbox from "@material-ui/core/Checkbox";

const getPopoverMenuItemTitle = label => {
  return <Typography variant="h6">{label}: </Typography>;
};

const presetColors = [];

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
  paper: { width: "20%", padding: "20px" }
});

class SettingsPopover extends React.Component {
  state = {
    color: this.props.menuItem.color,
    icon: this.props.menuItem.icon,
    expandedSubMenu: this.props.menuItem.expandedSubMenu
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

  updateDescriptiveIconText = e => {
    let value = e.target.value;
    this.setState(prevState => {
      prevState.icon.descriptiveText = value;
      return {
        icon: prevState.icon
      };
    });
  };

  updateExpandedSubMenuState = () => {
    this.setState({ expandedSubMenu: !this.state.expandedSubMenu });
  };

  saveAndClosePopover = () => {
    const { closePopover, updateMenuItem, treeNodeId } = this.props;
    let objectWithKeyValuesToUpdate = this.state;
    updateMenuItem(treeNodeId, objectWithKeyValuesToUpdate);
    closePopover();
  };

  renderExpandedByStartOption = () => {
    return (
      <Grid alignItems="center" container>
        <Grid item>
          <Typography>Expanderad submeny vid start</Typography>
        </Grid>
        <Grid item>
          <Checkbox
            checked={this.state.expandedSubMenu}
            onChange={this.updateExpandedSubMenuState}
            inputProps={{ "aria-label": "primary checkbox" }}
          />
        </Grid>
      </Grid>
    );
  };

  handleColorPickerChange = color => {
    this.setState({ color: color.hex });
  };

  renderSettings = () => {
    const { classes } = this.props;
    const { closePopover } = this.props;
    return (
      <form
        className={classes.paper}
        style={{ width: "500px", height: "600px" }}
        noValidate
        autoComplete="off"
      >
        <Grid spacing={2} container>
          <Grid xs={12} item>
            {this.props.menuItem.menu &&
              this.props.menuItem.menu.length > 0 &&
              this.renderExpandedByStartOption()}
          </Grid>
          <Grid xs={12} item>
            {getPopoverMenuItemTitle("Ikon")}
            {getTextField(
              this.state.icon.materialUiIconName,
              this.updateIconState,
              "standard"
            )}
          </Grid>
          <Grid xs={12} item>
            {getPopoverMenuItemTitle(
              "Beskrivande text för ikon (tillgänglighetsanpassning)"
            )}
            {getTextField(
              this.state.icon.descriptiveText,
              this.updateDescriptiveIconText,
              "standard"
            )}
          </Grid>

          <Grid xs={12} item>
            <Link
              target="_blank"
              href={this.props.iconLibraryLink}
              color="inherit"
            >
              {this.props.iconLibraryLink}
            </Link>
          </Grid>
          <Grid xs={12} item>
            {getPopoverMenuItemTitle("Färg")}
            {getTextField(this.state.color, this.updateColorState, "standard")}
          </Grid>
          <Grid xs={12} item>
            <SketchPicker
              presetColors={this.presetColors}
              color={this.state.color}
              onChange={this.handleColorPickerChange}
            ></SketchPicker>
          </Grid>
          <Grid xs={12} container item>
            <Grid xs={2} item>
              <ColorButtonGreen onClick={this.saveAndClosePopover}>
                <Typography variant="button">OK</Typography>
              </ColorButtonGreen>
            </Grid>
            <Grid xs={2} container item>
              <ColorButtonRed onClick={closePopover}>
                <Typography variant="button">AVBRYT</Typography>
              </ColorButtonRed>
            </Grid>
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
