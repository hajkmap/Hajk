import React from "react";
import { Component } from "react";
import SaveIcon from "@material-ui/icons/SaveSharp";
import MenuEditorModel from "../../../models/menuEditorModel";
import Grid from "@material-ui/core/Grid";
import Modal from "@material-ui/core/Modal";
import DragHandle from "@material-ui/icons/DragHandle";
import TreeRow from "./treerow.jsx";
import { withStyles } from "@material-ui/core/styles";
import { SketchPicker } from "react-color";

import {
  Typography,
  RadioGroup,
  Radio,
  FormControlLabel,
} from "@material-ui/core";

import {
  ColorButtonBlue,
  ColorButtonGreen,
  ColorButtonRed,
} from "./custombuttons.jsx";

import Tree from "antd/es/tree"; //Specific import to keep bundle-size small
import "antd/es/tree/style/css"; //Specific import to keep bundle-size small

const HEADER_KEY = -2;

const styles = (theme) => ({
  background: {
    backgroundColor: "#e8e8e8",
  },
  header: {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
  },
  warningText: {
    color: theme.palette.error.main,
  },
  textAreaSettings: {
    position: "relative",
  },
  disabledDiv: {
    position: "absolute",
    top: 0,
    backgroundColor: "white",
    opacity: 0.5,
    left: 0,
    bottom: 0,
    right: 0,
    zIndex: 10,
  },
});

class ToolOptions extends Component {
  state = {
    textAreacolorpickerEnabled: false,
    active: false,
    index: 0,
    title: "Dokumenthanterare",
    target: "hidden",
    showScrollButtonLimit: 400,
    dynamicImportUrls: {
      iconFonts: "https://fonts.googleapis.com/icon?family=Material+Icons",
      customFont: "https://fonts.googleapis.com/css?family=Open+Sans",
    },
    width: 600,
    height: "",
    menuConfig: {
      menu: [],
    },
    iconLibraryLink: "https://material.io/resources/icons/?style=baseline",
    customThemeUrl: "/documentHandlerTheme.json",
    openMenuEditor: false,
    validationErrors: [],
    documentOnStart: "",
    drawerTitle: "",
    drawerButtonTitle: "",
    resizingEnabled: false,
    draggingEnabled: false,
    searchImplemented: true,
    enablePrint: true,
    closePanelOnMapLinkOpen: false,
    displayLoadingOnMapLinkOpen: false,
    tableOfContents: {
      active: false,
      expanded: false,
      printMode: "none",
      chapterLevelsToShow: 2,
      title: "Innehållsförteckning",
    },
    defaultDocumentColorSettings: {
      textAreaBackgroundColor: "",
      textAreaDividerColor: "",
    },
    tree: {},
  };
  treeKeys = [];
  menuConfig = {
    menu: [],
  };
  availableDocuments = [];

  constructor(props) {
    super(props);
    this.type = "documenthandler";
    this.mapSettingsModel = props.model;
    this.menuEditorModel = this.getMenuEditorModel();
    this.menuEditorModel.listAllAvailableDocuments().then((list) => {
      this.availableDocuments = list;
    });
  }

  handleColorChange = (target, color) => {
    this.setState((prevState) => ({
      defaultDocumentColorSettings: {
        ...prevState.defaultDocumentColorSettings,
        [target]: color,
      },
    }));
  };

  getMenuEditorModel = () => {
    return new MenuEditorModel({
      config: this.props.model.get("config"),
    });
  };

  // Methods copied from other admin-tools to save settings correctly
  //
  //
  componentDidMount = () => {
    var tool = this.getTool();
    if (tool) {
      this.setState({
        textAreacolorpickerEnabled:
          tool.options.defaultDocumentColorSettings.textAreaBackgroundColor ||
          tool.options.defaultDocumentColorSettings.textAreaDividerColor
            ? true
            : false,
        active: true,
        index: tool.index,
        target: tool.options.target,
        title: tool.options.title || "",
        showScrollButtonLimit: tool.options.showScrollButtonLimit,
        dynamicImportUrls: tool.options.dynamicImportUrls,
        customThemeUrl: tool.options.customThemeUrl,
        width: tool.options.width,
        height: tool.options.height,
        menuConfig: tool.options.menuConfig,
        iconLibraryLink: tool.options.iconLibraryLink,
        documentOnStart: tool.options.documentOnStart,
        drawerTitle: tool.options.drawerTitle,
        drawerButtonTitle: tool.options.drawerButtonTitle,
        resizingEnabled: tool.options.resizingEnabled || false,
        draggingEnabled: tool.options.draggingEnabled || false,
        searchImplemented: tool.options.searchImplemented,
        enablePrint: tool.options.enablePrint,
        closePanelOnMapLinkOpen: tool.options.closePanelOnMapLinkOpen,
        displayLoadingOnMapLinkOpen:
          tool.options.displayLoadingOnMapLinkOpen || false,
        tableOfContents: tool.options.tableOfContents,
        defaultDocumentColorSettings: tool.options
          .defaultDocumentColorSettings || {
          textAreaBackgroundColor: "",
          textAreaDividerColor: "",
        },
      });
    } else {
      this.setState({
        active: false,
      });
    }
  };

  handleInputChange(event) {
    const target = event.target;
    const name = target.name;
    var value = target.type === "checkbox" ? target.checked : target.value;
    if (typeof value === "string" && value.trim() !== "") {
      value = !isNaN(Number(value)) ? Number(value) : value;
    }
    this.setState({
      [name]: value,
    });
  }

  getTool() {
    return this.props.model
      .get("toolConfig")
      .find((tool) => tool.type === this.type);
  }

  add(tool) {
    this.props.model.get("toolConfig").push(tool);
  }

  remove() {
    this.props.model.set({
      toolConfig: this.props.model
        .get("toolConfig")
        .filter((tool) => tool.type !== this.type),
    });
  }

  toggleTextAreaColorpickers = () => {
    //React batches multiple setState in eventhandler so this should be fine
    this.setState((prevState) => {
      if (prevState.textAreacolorpickerEnabled) {
        this.handleColorChange("textAreaBackgroundColor", "");
        this.handleColorChange("textAreaDividerColor", "");
      }
      return {
        textAreacolorpickerEnabled: !prevState.textAreacolorpickerEnabled,
      };
    });
  };

  replace(tool) {
    this.props.model.get("toolConfig").forEach((t) => {
      if (t.type === this.type) {
        t.options = tool.options;
        t.index = tool.index;
      }
    });
  }

  saveFromMenuEditor() {
    this.menuConfig = this.menuEditorModel.exportTreeAsMenuJson(
      this.state.tree,
      this.menuConfig
    );
    this.setState({ menuConfig: this.menuConfig }, () => {
      this.save();
    });
  }

  save() {
    var tool = {
      type: this.type,
      index: this.state.index,
      options: {
        title: this.state.title,
        target: this.state.target,
        showScrollButtonLimit: this.state.showScrollButtonLimit,
        dynamicImportUrls: this.state.dynamicImportUrls,
        iconLibraryLink: this.state.iconLibraryLink,
        customThemeUrl: this.state.customThemeUrl,
        width: this.state.width,
        height: this.state.height,
        searchImplemented: this.state.searchImplemented,
        enablePrint: this.state.enablePrint,
        closePanelOnMapLinkOpen: this.state.closePanelOnMapLinkOpen,
        displayLoadingOnMapLinkOpen: this.state.displayLoadingOnMapLinkOpen,
        documentOnStart: this.state.documentOnStart,
        drawerTitle: this.state.drawerTitle,
        drawerButtonTitle: this.state.drawerButtonTitle,
        resizingEnabled: this.state.resizingEnabled,
        draggingEnabled: this.state.draggingEnabled,
        tableOfContents: this.state.tableOfContents,
        defaultDocumentColorSettings: this.state.defaultDocumentColorSettings,
        menuConfig: this.state.menuConfig,
      },
    };

    var existing = this.getTool();

    function update() {
      this.props.model.updateToolConfig(
        this.props.model.get("toolConfig"),
        () => {
          this.props.parent.props.parent.setState({
            alert: true,
            alertMessage: "Uppdateringen lyckades",
          });
        }
      );
    }
    if (!this.state.active) {
      if (existing) {
        this.props.parent.props.parent.setState({
          alert: true,
          confirm: true,
          alertMessage:
            "Verktyget kommer att tas bort. Nuvarande inställningar kommer att gå förlorade. Vill du fortsätta?",
          confirmAction: () => {
            this.remove();
            update.call(this);
          },
        });
      } else {
        this.remove();
        update.call(this);
      }
    } else {
      if (existing) {
        this.replace(tool);
      } else {
        this.add(tool);
      }
      update.call(this);
    }
  }
  //
  //
  //END

  onCloseMenuEditorClick = (e) => {
    e.preventDefault();
    this.setState({ openMenuEditor: false, tree: [] });
  };

  onSaveMenuEditsClick = (e) => {
    e.preventDefault();
    this.setState({ openMenuEditor: false }, () => {
      this.saveFromMenuEditor();
    });
  };

  onNewTreeRowClick = (e) => {
    e.preventDefault();
    this.addNewItem();
  };

  //getHeader = (canSave) => {
  getHeader = () => {
    const { classes } = this.props;
    return (
      <Grid
        className={classes.header}
        spacing={1}
        alignItems="center"
        justify="flex-end"
        container
      >
        <Grid xs={1} item>
          <DragHandle></DragHandle>
        </Grid>
        <Grid xs={1} item></Grid>
        <Grid xs={2} item>
          <Typography variant="h5">Namn</Typography>
        </Grid>

        <Grid xs={8} container item>
          <Grid xs={3} item>
            <Typography variant="h5">Inställningar</Typography>
          </Grid>
          <Grid xs={2} item>
            <Typography variant="h5">Koppling</Typography>
          </Grid>

          <Grid ref={this.buttonHeaderRef} xs={4} item>
            <ColorButtonGreen
              variant="contained"
              className="btn"
              onClick={this.onNewTreeRowClick}
            >
              <Typography variant="button">Ny menylänk</Typography>
            </ColorButtonGreen>
            <ColorButtonBlue
              variant="contained"
              className="btn"
              //disabled={!canSave}
              onClick={this.onSaveMenuEditsClick}
              startIcon={<SaveIcon />}
            >
              <Typography variant="button">Spara</Typography>
            </ColorButtonBlue>
          </Grid>
          <Grid xs={1} item></Grid>
          <Grid xs={1} item>
            <ColorButtonRed
              variant="contained"
              className="btn"
              onClick={this.onCloseMenuEditorClick}
            >
              <Typography variant="button">Avbryt</Typography>
            </ColorButtonRed>
          </Grid>
        </Grid>
      </Grid>
    );
  };

  addNewItem = () => {
    let menuItem = this.menuEditorModel.getNewMenuItemObject();
    let newTree = [...this.state.tree];
    newTree.push(this.createTreeChild(menuItem));
    this.setState({ tree: newTree });
  };

  addHeaderRowToTreeStructure = (treeData) => {
    treeData.unshift({
      title: this.getHeader(
        this.menuEditorModel.canSave(this.getTreeWithoutHeader(treeData))
      ),
      disabled: true,
      children: [],
      menuItem: [],
      key: HEADER_KEY,
    });
  };

  getTreeView = () => {
    return this.menuEditorModel
      .loadMenuConfigForMap(this.mapSettingsModel.get("mapFile"))
      .then((toolConfig) => {
        if (toolConfig && toolConfig?.options?.menuConfig) {
          this.menuConfig = toolConfig.options.menuConfig;
        }
        let treeData = this.createTreeStructure(this.menuConfig.menu);
        return treeData;
      });
  };

  createTreeStructure = (menu) => {
    this.treeKeys = [];
    let tree = this.createTree(menu);
    this.menuEditorModel.setParentForAllTreeNodes(tree);
    return tree;
  };

  createTree = (menu) => {
    return menu.map((menuItem) => {
      return this.createTreeChild(menuItem);
    });
  };

  getNewTreeKey = () => {
    let newKey = 0;
    if (this.treeKeys.length > 0) {
      newKey = this.treeKeys[this.treeKeys.length - 1] + 1;
    }
    this.treeKeys.push(newKey);
    return newKey;
  };

  getRowTitleComponent = (menuItem, children, key) => {
    return (
      <TreeRow
        iconLibraryLink={this.state.iconLibraryLink}
        updateMenuItem={this.updateMenuItem}
        deleteMenuItem={this.deleteMenuItem}
        options={this.state}
        model={this.menuEditorModel}
        availableDocuments={this.availableDocuments}
        menuItem={menuItem}
        updateValidationForTreeNode={this.updateValidationForTreeNode}
        valid={this.menuEditorModel.isSelectionValid(menuItem, children)}
        treeNodeId={key}
      ></TreeRow>
    );
  };

  //Need to manually update title-component because cant incorporate into render method
  updateTreeRowComponent = (treeNode) => {
    treeNode.title = this.getRowTitleComponent(
      treeNode.menuItem,
      treeNode.children,
      treeNode.key
    );
  };

  updateTreeValidation = (tree) => {
    tree.forEach((treeNode) => {
      if (treeNode.key !== HEADER_KEY) {
        this.updateValidation(treeNode);
      }
    });
  };

  updateValidationForTreeNode = (treeNodeId) => {
    let newTree = [...this.state.tree];
    let foundTreeNode = this.menuEditorModel.findInTree(newTree, treeNodeId);
    this.updateValidation(foundTreeNode);
    this.setState({ tree: newTree });
  };

  updateValidation = (treeNode) => {
    this.updateTreeRowComponent(treeNode);

    if (treeNode.children.length > 0) {
      treeNode.children.forEach((child) => {
        this.updateValidation(child);
      });
    }
  };

  createTreeChild = (menuItem) => {
    let children = [];
    if (menuItem.menu && menuItem.menu.length > 0) {
      children = this.createTree(menuItem.menu);
    }
    let key = this.getNewTreeKey().toString();

    return {
      title: this.getRowTitleComponent(menuItem, children, key),
      children: children,
      selectable: false,
      menuItem: this.menuEditorModel.getMenuItemWithoutChildren(menuItem),
      key: key,
    };
  };

  onDropNode = (info) => {
    const dropKey = info.node.props.eventKey;
    const dragKey = info.dragNode.props.eventKey;
    let newTree = [...this.state.tree];
    let foundDragNode = this.menuEditorModel.getNodeFromTree(newTree, dragKey);
    let foundDropNode = this.menuEditorModel.getNodeFromTree(newTree, dropKey);

    if (!this.menuEditorModel.isSameNode(foundDropNode, foundDragNode)) {
      if (info.dropToGap) {
        if (this.menuEditorModel.isParentRootOfTree(foundDropNode.parent)) {
          this.menuEditorModel.addToTreeRoot(
            newTree,
            foundDragNode,
            foundDropNode,
            info
          );
        } else {
          this.menuEditorModel.addToGap(
            newTree,
            foundDragNode,
            foundDropNode,
            info
          );
        }
      } else {
        this.menuEditorModel.addToDropNode(
          newTree,
          foundDragNode,
          foundDropNode
        );
      }

      this.saveNewTree(newTree);
    }
  };

  getTreeWithoutHeader = (tree) => {
    return tree.filter((treeNode) => {
      return treeNode.key !== HEADER_KEY;
    });
  };

  //Need to manually update title-component because cant incorporate into render method
  saveNewTree = (newTree) => {
    this.updateTreeValidation(newTree);
    newTree[0].title = this.getHeader(
      this.menuEditorModel.canSave(this.getTreeWithoutHeader(newTree))
    );
    this.setState({ tree: newTree });
  };

  updateMenuItem = (treeNodeId, objectWithKeyValuesToUpdate) => {
    let newTreeState = [...this.state.tree];
    let treeNode = this.menuEditorModel.findInTree(newTreeState, treeNodeId);
    if (treeNode) {
      treeNode.menuItem = {
        ...treeNode.menuItem,
        ...objectWithKeyValuesToUpdate,
      };

      this.updateTreeRowComponent(treeNode);
      this.saveNewTree(newTreeState);
    }
    return treeNode;
  };

  deleteTreeNode = (nodeArrayToSearch, treeNodeToDelete) => {
    nodeArrayToSearch.forEach((child) => {
      if (child.key === treeNodeToDelete.key) {
        nodeArrayToSearch.splice(
          nodeArrayToSearch.indexOf(treeNodeToDelete),
          1
        );
      }
    });
  };

  isRootNode = (treeNode) => {
    return treeNode.parent === undefined ? true : false;
  };

  deleteMenuItem = (treeNodeId) => {
    let newTreeState = [...this.state.tree];
    let treeNode = this.menuEditorModel.findInTree(newTreeState, treeNodeId);
    if (this.isRootNode(treeNode)) {
      this.deleteTreeNode(newTreeState, treeNode);
    } else {
      this.deleteTreeNode(treeNode.parent.children, treeNode);
    }
    this.saveNewTree(newTreeState);
  };

  onEditMenuClick = (e) => {
    e.preventDefault();
    this.getTreeView().then((treeData) => {
      this.addHeaderRowToTreeStructure(treeData);
      this.setState({ openMenuEditor: true, tree: treeData });
    });
  };

  render() {
    const { classes } = this.props;
    let expandedKeys = this.treeKeys.map((key) => {
      return key.toString();
    });

    return (
      <div style={{ marginBottom: "10px" }}>
        <form>
          <p>
            <ColorButtonBlue
              variant="contained"
              className="btn"
              onClick={(e) => {
                e.preventDefault();
                this.save();
              }}
              startIcon={<SaveIcon />}
            >
              Spara
            </ColorButtonBlue>
          </p>
          <div>
            <input
              id="active"
              name="active"
              type="checkbox"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.active}
            />
            &nbsp;
            <label htmlFor="active">Aktiverad</label>
          </div>
          <div className="separator">Menyinställningar</div>
          <p>
            <ColorButtonBlue
              variant="contained"
              className="btn"
              onClick={this.onEditMenuClick}
              startIcon={<SaveIcon />}
            >
              <Typography variant="button">Redigera meny</Typography>
            </ColorButtonBlue>
          </p>
          <div className="separator">Generella inställningar</div>
          <div>
            <label htmlFor="width">
              Fönsterbredd{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Bredd i pixlar på verktygets fönster. Anges som ett numeriskt värde. Lämna tomt för att använda standardbredd."
              />
            </label>
            <input
              id="width"
              name="width"
              type="number"
              min="0"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.width}
            />
          </div>
          <div>
            <label htmlFor="height">
              Fönsterhöjd{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Höjd i pixlar på verktygets fönster. Anges antingen numeriskt (pixlar), 'dynamic' för att automatiskt anpassa höjden efter innehållet eller 'auto' att använda maximal höjd."
              />
            </label>
            <input
              id="height"
              name="height"
              type="text"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.height}
            />
          </div>

          <div>
            <label htmlFor="documentOnStart">
              Startdokument{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Dokument som ska vara öppet när kartan öppnas. Lämna tom om ingen dokument ska visas"
              />
            </label>
            <input
              id="documentOnStart"
              value={this.state.documentOnStart}
              type="text"
              name="documentOnStart"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="drawerTitle">
              Paneltitel{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Titel på dokumentverktygets panel. Detta visas högst upp i panelen"
              />
            </label>
            <input
              id="drawerTitle"
              value={this.state.drawerTitle}
              type="text"
              name="drawerTitle"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <label htmlFor="drawerButtonTitle">
              Knapptitel{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Text på knapp som öppna verktyget"
              />
            </label>
            <input
              id="drawerButtonTitle"
              value={this.state.drawerButtonTitle}
              type="text"
              name="drawerButtonTitle"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
            />
          </div>
          <div>
            <input
              id="searchImplemented"
              name="searchImplemented"
              type="checkbox"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.searchImplemented}
            />
            &nbsp;
            <label htmlFor="searchImplemented">Sökning aktiverad</label>
          </div>
          <div>
            <input
              id="resizingEnabled"
              name="resizingEnabled"
              type="checkbox"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.resizingEnabled}
            />
            &nbsp;
            <label htmlFor="resizingEnabled">
              Tillåt att ändra storlek på dokumentfönstret
            </label>
          </div>
          <div>
            <input
              id="draggingEnabled"
              name="draggingEnabled"
              type="checkbox"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.draggingEnabled}
            />
            &nbsp;
            <label htmlFor="draggingEnabled">
              Tillåt att flytta på dokumentfönstret
            </label>
          </div>
          <div>
            <input
              id="enablePrint"
              name="enablePrint"
              type="checkbox"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.enablePrint}
            />
            &nbsp;
            <label htmlFor="enablePrint">Utskrift aktiverad</label>
          </div>
          <div>
            <input
              id="closePanelOnMapLinkOpen"
              name="closePanelOnMapLinkOpen"
              type="checkbox"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.closePanelOnMapLinkOpen}
            />
            &nbsp;
            <label style={{ width: "200px" }} htmlFor="closePanelOnMapLinkOpen">
              Stäng dokumentfönster vid klick på kartlänk
            </label>
          </div>
          <div>
            <input
              id="displayLoadingOnMapLinkOpen"
              name="displayLoadingOnMapLinkOpen"
              type="checkbox"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.displayLoadingOnMapLinkOpen}
            />
            &nbsp;
            <label
              style={{ width: "200px" }}
              htmlFor="displayLoadingOnMapLinkOpen"
            >
              Visa 'Kartan laddar' dialog vid klick på kartlänk
            </label>
          </div>
          <div className="separator">Innehållsförteckning</div>
          <div>
            <input
              id="tableOfContentsActive"
              name="tableOfContentsActive"
              type="checkbox"
              onChange={(e) => {
                //gör så här för att den är object i state som den befintlig handleInputChange inte hantera.
                const checked = e.target.checked;
                this.setState((prevState) => ({
                  tableOfContents: {
                    ...prevState.tableOfContents,
                    active: checked,
                  },
                }));
              }}
              checked={this.state.tableOfContents.active}
            />
            &nbsp;
            <label htmlFor="tableOfContentsActive">Aktiverad</label>
          </div>
          <div>
            <input
              id="tableOfContentsExpanded"
              name="tableOfContentsExpanded"
              type="checkbox"
              onChange={(e) => {
                //gör så här för att den är object i state som den befintlig handleInputChange inte hantera.
                const checked = e.target.checked;
                this.setState((prevState) => ({
                  tableOfContents: {
                    ...prevState.tableOfContents,
                    expanded: checked,
                  },
                }));
              }}
              checked={this.state.tableOfContents.expanded}
            />
            &nbsp;
            <label htmlFor="tableOfContentsExpanded">Expanderad</label>
          </div>
          <div>
            <label htmlFor="tableOfContentsTitle">
              Titel{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Innehållsförteckning titel"
              />
            </label>
            <input
              id="tableOfContentsTitle"
              value={this.state.tableOfContents.title}
              type="text"
              name="tableOfContentsTitle"
              onChange={(e) => {
                const value = e.target.value;
                this.setState((prevState) => ({
                  tableOfContents: {
                    ...prevState.tableOfContents,
                    title: value,
                  },
                }));
              }}
            />
          </div>
          <div>
            <label htmlFor="chapterLevelsToShow">
              Antal kapitelnivåer{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Antal kapitel nivåer som ska ingå i innehållsförteckningen"
              />
            </label>
            <input
              id="chapterLevelsToShow"
              name="chapterLevelsToShow"
              type="number"
              min="0"
              className="control-fixed-width"
              onChange={(e) => {
                const value = e.target.value;
                this.setState((prevState) => ({
                  tableOfContents: {
                    ...prevState.tableOfContents,
                    chapterLevelsToShow: value,
                  },
                }));
              }}
              value={this.state.tableOfContents.chapterLevelsToShow}
            />
          </div>
          <div>
            <label htmlFor="tocPrintMode" style={{ width: "400px" }}>
              Välj hur innehållsförteckningen skall skivas ut{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Välj hur innehållsförteckning ska skrivas ut"
              />
            </label>
            <RadioGroup
              id="printMode"
              name="printMode"
              value={this.state.tableOfContents.printMode}
              onChange={(e) => {
                const value = e.target.value;
                this.setState((prevState) => ({
                  tableOfContents: {
                    ...prevState.tableOfContents,
                    printMode: value,
                  },
                }));
              }}
            >
              <FormControlLabel
                value="full"
                control={<Radio color="primary" />}
                label="Hela"
              />
              <FormControlLabel
                value="partial"
                control={<Radio color="primary" />}
                label="Valda"
              />
              <FormControlLabel
                value="none"
                control={<Radio color="primary" />}
                label="Inga"
              />
            </RadioGroup>
          </div>
          <div className="separator">Faktaruta</div>
          <div>
            <input
              id="override_textarea_color"
              name="override_textarea_color"
              type="checkbox"
              onChange={this.toggleTextAreaColorpickers}
              checked={this.state.textAreacolorpickerEnabled}
            />
            &nbsp;
            <label htmlFor="override_textarea_color">Aktiverad</label>
          </div>
          <div>
            <p className={classes.warningText}>
              <b>
                Vid användning av dessa inställningar riskeras dark/light-mode
                sättas ur spel
              </b>
            </p>
          </div>
          <div className={`${classes.textAreaSettings} clearfix`}>
            {!this.state.textAreacolorpickerEnabled && (
              //Add div on top of colorpickers to make them look disabled.
              <div className={classes.disabledDiv}></div>
            )}
            <span className="pull-left">
              <div>
                <label className="long-label" htmlFor="textAreaBackgroundColor">
                  Bakgrundsfärg
                  <i
                    className="fa fa-question-circle"
                    data-toggle="tooltip"
                    title="Färg till textområdets bakgrund"
                  />
                </label>
              </div>
              <div>
                <SketchPicker
                  color={
                    this.state.defaultDocumentColorSettings
                      .textAreaBackgroundColor
                  }
                  onChangeComplete={(color) =>
                    this.handleColorChange("textAreaBackgroundColor", color.hex)
                  }
                />
              </div>
            </span>
            <span className="pull-left" style={{ marginLeft: "10px" }}>
              <div>
                <label htmlFor="textAreaDividerColor">
                  Kantfärg{" "}
                  <i
                    className="fa fa-question-circle"
                    data-toggle="tooltip"
                    title="Färg till textområdets skiljelinje"
                  />
                </label>
              </div>
              <div>
                <SketchPicker
                  color={
                    this.state.defaultDocumentColorSettings.textAreaDividerColor
                  }
                  onChangeComplete={(color) =>
                    this.handleColorChange("textAreaDividerColor", color.hex)
                  }
                />
              </div>
            </span>
          </div>
          <section className="tab-pane active">
            <Modal
              style={{
                position: "absolute",
                top: "100px",
                left: "100px",
                right: "100px",
              }}
              open={this.state.openMenuEditor}
            >
              {this.state.tree && expandedKeys ? (
                <Grid className={classes.background} container>
                  <Grid xs={12} item>
                    <Tree
                      blockNode
                      height={window.innerHeight - 200}
                      virtual={false} //Makes scroll work when drag
                      switcherIcon={<></>}
                      onDrop={this.onDropNode}
                      expandedKeys={expandedKeys}
                      treeData={this.state.tree}
                      draggable
                    ></Tree>
                  </Grid>
                </Grid>
              ) : (
                <></>
              )}
            </Modal>
          </section>
        </form>
      </div>
    );
  }
}

//

export default withStyles(styles)(ToolOptions);
