import React from "react";
import Grid from "@material-ui/core/Grid";
import TextField from "@material-ui/core/TextField";
import DeleteIcon from "@material-ui/icons/Delete";
import SettingsIcon from "@material-ui/icons/Settings";
import DragHandle from "@material-ui/icons/DragHandle";
import { withStyles } from "@material-ui/core/styles";
import { IconButton } from "@material-ui/core";
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

const styles = () => ({
  test: { padding: "100px" }
});

class TreeRow extends React.Component {
  state = {
    menuItemTitle: this.props.menuItem.title
  };

  componentWillUnmount = () => {
    const { updateMenuItem, treeNodeId } = this.props;
    console.log(this.state.menuItemTitle, "this.state.menuItemTitle");
    updateMenuItem(treeNodeId, { title: this.state.menuItemTitle });
  };

  constructor(props) {
    super(props);
    console.log(this.props.menuItem.title, "menuItemTitle");
  }

  renderConnectionSelect = () => {
    const {
      model,
      treeNodeId,
      updateMenuItem,
      availableDocuments,
      menuItem
    } = this.props;
    console.log(this.props.tree, "this.props.tree");
    return (
      <MenuConnectionSelector
        treeNodeId={treeNodeId}
        updateMenuItem={updateMenuItem}
        updateTreeValidation={this.updateTreeValidation}
        availableDocuments={availableDocuments}
        model={this.props.model}
        updateValidation={this.props.updateValidation}
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
        style={{ padding: "0px" }}
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
    return (
      <Grid
        style={{
          border: "1px solid rgba(153,164,161,0.5)",
          borderRadius: "8px"
        }}
        justify="flex-end"
        container
      >
        <Grid xs={1} item>
          <DragHandle></DragHandle>
        </Grid>
        <Grid xs={2} item>
          {this.renderMenuTitle()}
        </Grid>
        <Grid xs={9} container item>
          <Grid xs={3} item>
            {this.renderSettingsMenu()}
          </Grid>
          <Grid xs={3} item>
            {this.renderConnectionSelect()}
          </Grid>
          <Grid xs={3} item>
            {this.renderRemoveButton()}
          </Grid>
        </Grid>
      </Grid>
    );
  };
}

export default withStyles(styles)(TreeRow);
