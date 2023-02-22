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
import WarningModal from "./warningModal.jsx";

const CONNECTION_SELECTORS = [
  {
    id: "DOCUMENT",
    gridSize: 4,
  },
  {
    id: "MAP_LINK",
    gridSize: 2,
  },
  {
    id: "LINK",
    gridSize: 2,
  },
];

const getTextField = (value, onChangeFunction, variant) => {
  return (
    <TextField
      label={""}
      type="icon"
      variant={variant}
      value={value}
      onChange={onChangeFunction}
    />
  );
};

const styles = () => ({
  treeRowRoot: {
    border: "1px solid rgba(153,164,161,0.5)",
    borderRadius: "8px",
  },
});

class TreeRow extends React.Component {
  state = {
    menuItemTitle: this.props.menuItem.title,
    showWarning: false,
  };

  dynamicallyImportIconFonts = () => {
    const { dynamicImportUrls } = this.props.options;
    return <link rel="stylesheet" href={dynamicImportUrls.iconFonts} />;
  };

  getIcon = (icon) => {
    return <Icon>{icon.materialUiIconName}</Icon>;
  };

  componentWillUnmount = () => {
    const { updateMenuItem, treeNodeId } = this.props;
    updateMenuItem(treeNodeId, { title: this.state.menuItemTitle });
  };

  showWarning = () => {
    this.setState({ showWarning: true });
  };

  hideWarning = () => {
    this.setState({ showWarning: false });
  };

  renderRemoveButton = () => {
    return (
      <IconButton
        onClick={() => {
          this.showWarning();
        }}
      >
        <DeleteIcon></DeleteIcon>
      </IconButton>
    );
  };

  openSettingsMenu = (e) => {
    this.setState({
      settingsMenuAnchorEl: e.currentTarget,
    });
  };

  closeSettingsMenu = () => {
    this.setState({ settingsMenuAnchorEl: null });
  };

  renderSettingsMenu = () => {
    const { settingsMenuAnchorEl, showWarning } = this.state;
    const { updateMenuItem, menuItem, treeNodeId, deleteMenuItem } = this.props;
    return (
      <>
        <WarningModal
          handleApproveClick={() => {
            deleteMenuItem(treeNodeId);
          }}
          handleCancelClick={this.hideWarning}
          open={showWarning}
        ></WarningModal>
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
      (e) => {
        this.setState({ menuItemTitle: e.target.value });
      },
      "standard"
    );
  };

  render = () => {
    const {
      classes,
      model,
      treeNodeId,
      updateMenuItem,
      availableDocuments,
      folders,
      menuItem,
    } = this.props;
    return (
      <>
        {this.dynamicallyImportIconFonts()}
        <Grid
          alignItems="center"
          className={classes.treeRowRoot}
          justifyContent="flex-end"
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
            {CONNECTION_SELECTORS.map((cs) => {
              return (
                <Grid item key={cs.id} xs={cs.gridSize}>
                  <MenuConnectionSelector
                    treeNodeId={treeNodeId}
                    updateMenuItem={updateMenuItem}
                    updateTreeValidation={this.updateTreeValidation}
                    availableDocuments={availableDocuments}
                    folders={folders}
                    updateValidationForTreeNode={
                      this.props.updateValidationForTreeNode
                    }
                    model={model}
                    type={cs.id}
                    menuItem={menuItem}
                    onFolderSelection={this.props.onFolderSelection}
                    folder={this.props.folder}
                  />
                </Grid>
              );
            })}
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
