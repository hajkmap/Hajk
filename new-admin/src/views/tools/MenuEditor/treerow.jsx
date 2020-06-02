import React from "react";
import Grid from "@material-ui/core/Grid";
import TextField from "@material-ui/core/TextField";
import DeleteIcon from "@material-ui/icons/Delete";
import SettingsIcon from "@material-ui/icons/Settings";
import DragHandle from "@material-ui/icons/DragHandle";
import { withStyles } from "@material-ui/core/styles";
import { IconButton } from "@material-ui/core";
import Icon from "@material-ui/core/Icon";
import SettingsPopover from "./settingspopover.jsx";
import MenuConnectionSelector from "./menuconnectionselector.jsx";

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

//TODO - HARDCODED
const iconFontElement = (
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/icon?family=Material+Icons"
  />
);

const styles = () => ({
  treeRowRoot: {
    border: "1px solid rgba(153,164,161,0.5)",
    borderRadius: "8px"
  }
});

class TreeRow extends React.Component {
  state = {
    menuItemTitle: this.props.menuItem.title
  };

  dynamicallyImportIconFonts = () => {
    return iconFontElement;
  };

  getIcon = icon => {
    return <Icon>{icon.materialUiIconName}</Icon>;
  };

  componentWillUnmount = () => {
    const { updateMenuItem, treeNodeId } = this.props;
    updateMenuItem(treeNodeId, { title: this.state.menuItemTitle });
  };

  renderConnectionSelect = () => {
    const {
      model,
      treeNodeId,
      updateMenuItem,
      availableDocuments,
      menuItem
    } = this.props;

    return (
      <MenuConnectionSelector
        treeNodeId={treeNodeId}
        updateMenuItem={updateMenuItem}
        updateTreeValidation={this.updateTreeValidation}
        availableDocuments={availableDocuments}
        updateValidationForTreeNode={this.props.updateValidationForTreeNode}
        valid={this.props.valid}
        model={model}
        menuItem={menuItem}
      ></MenuConnectionSelector>
    );
  };

  renderRemoveButton = () => {
    const { deleteMenuItem, treeNodeId } = this.props;
    return (
      <IconButton
        onClick={() => {
          deleteMenuItem(treeNodeId);
        }}
      >
        <DeleteIcon></DeleteIcon>
      </IconButton>
    );
  };

  openSettingsMenu = e => {
    this.setState({
      settingsMenuAnchorEl: e.currentTarget
    });
  };

  closeSettingsMenu = () => {
    this.setState({ settingsMenuAnchorEl: null });
  };

  renderSettingsMenu = () => {
    const { settingsMenuAnchorEl } = this.state;
    const { updateMenuItem, menuItem, treeNodeId } = this.props;
    return (
      <>
        <IconButton size="small" onClick={this.openSettingsMenu}>
          <SettingsIcon></SettingsIcon>
        </IconButton>
        <SettingsPopover
          iconLibraryLink={this.props.iconLibraryLink}
          treeNodeId={treeNodeId}
          menuItem={menuItem}
          updateMenuItem={updateMenuItem}
          anchorEl={settingsMenuAnchorEl}
          open={Boolean(settingsMenuAnchorEl)}
          closePopover={this.closeSettingsMenu}
        ></SettingsPopover>
      </>
    );
  };

  renderMenuTitle = () => {
    return getTextField(
      this.state.menuItemTitle,
      e => {
        this.setState({ menuItemTitle: e.target.value });
      },
      "standard"
    );
  };

  render = () => {
    const { classes, menuItem } = this.props;
    return (
      <>
        {this.dynamicallyImportIconFonts()}
        <Grid
          alignItems="center"
          className={classes.treeRowRoot}
          justify="flex-end"
          container
        >
          <Grid xs={1} item>
            <DragHandle></DragHandle>
          </Grid>
          <Grid xs={1} item>
            {this.getIcon(menuItem.icon)}
          </Grid>
          <Grid xs={2} item>
            {this.renderMenuTitle()}
          </Grid>
          <Grid xs={8} alignItems="center" container item>
            <Grid xs={3} item>
              {this.renderSettingsMenu()}
            </Grid>
            <Grid xs={4} item>
              {this.renderConnectionSelect()}
            </Grid>
            <Grid xs={1} item>
              {this.renderRemoveButton()}
            </Grid>
          </Grid>
        </Grid>
      </>
    );
  };
}

export default withStyles(styles)(TreeRow);
