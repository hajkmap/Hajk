import React from "react";
import { Component } from "react";
import MapOptions from "./mapoptions.jsx";
import ToolOptions from "./tooloptions.jsx";
import Button from "@material-ui/core/Button";
import $ from "jquery";
import Alert from "../views/alert.jsx";
import ListProperties from "../views/listproperties.jsx";
import Divider from "@material-ui/core/Divider";
import DeleteIcon from "@material-ui/icons/DeleteForever";
import AddIcon from "@material-ui/icons/Add";
import SaveIcon from "@material-ui/icons/SaveSharp";
import CreateNewFolderIcon from "@material-ui/icons/CreateNewFolder";
import OpenInNewIcon from "@material-ui/icons/OpenInNew";
import LayersIcon from "@material-ui/icons/Layers";
import SwapVertIcon from "@material-ui/icons/SwapVert";
import SettingsIcon from "@material-ui/icons/Settings";
import BuildIcon from "@material-ui/icons/Build";
import StarIcon from "@material-ui/icons/Star";
import HighlightOffIcon from "@material-ui/icons/HighlightOff";
import CheckCircleOutline from "@material-ui/icons/CheckCircleOutline";
import { withStyles } from "@material-ui/core/styles";
import { red, green, blue } from "@material-ui/core/colors";
import { v4 as uuidv4 } from "uuid";

var defaultState = {
  alert: false,
  corfirm: false,
  alertMessage: "",
  content: "",
  maps: [],
  confirmAction: () => {},
  denyAction: () => {},
};

const ColorButtonRed = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(red[500]),
    backgroundColor: red[500],
    "&:hover": {
      backgroundColor: red[700],
    },
  },
}))(Button);

const ColorButtonGreen = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(green[700]),
    backgroundColor: green[500],
    "&:hover": {
      backgroundColor: green[700],
    },
  },
}))(Button);

const ColorButtonBlue = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(blue[500]),
    backgroundColor: blue[500],
    "&:hover": {
      backgroundColor: blue[700],
    },
  },
}))(Button);

$.fn.editable = function (component) {
  function edit(node, e) {
    function reset() {
      ok.remove();
      abort.remove();
      remove.remove();
      toggled.remove();
      expanded.remove();
      tools.remove();
      layerTools.remove();
      presetTools.remove();
      elem.editing = false;
    }

    function store() {
      let name = input.val();
      let toggled = checkbox2.is(":checked");
      let expanded = checkbox.is(":checked");
      node.html(name);
      node.parent().attr("data-name", name);
      node.parent().attr("data-toggled", toggled);
      node.parent().attr("data-expanded", expanded);
      reset();
    }

    function saveLayer() {
      let visible = checkbox3.is(":checked");

      if (component.state.authActive) {
        node.parent().attr("data-visibleforgroups", input3.val());
      }
      node.parent().attr("data-infobox", input4.val());
      node.parent().attr("data-visibleatstart", visible);
      if (visible) {
        node.parent().addClass("visible");
      } else {
        node.parent().removeClass("visible");
      }
      reset();
    }

    var btnCSS = {
        marginLeft: "4px",
        position: "relative",
        top: "-1px",
      },
      prev = node.html(),
      id = Math.floor(Math.random() * 1e5),
      id2 = Math.floor(Math.random() * 1e5),
      id3 = Math.floor(Math.random() * 1e5),
      id4 = Math.floor(Math.random() * 1e5),
      id5 = Math.floor(Math.random() * 1e5),
      id6 = Math.floor(Math.random() * 1e5),
      id7 = Math.floor(Math.random() * 1e5),
      ok = $('<span class="btn btn-success">OK</span>'),
      layerOk = $('<span class="btn btn-success">OK</span>'),
      layerOk2 = $('<span class="btn btn-success">OK</span>'),
      presetTools = $("<div></div>"),
      tools = $("<div></div>"),
      layerTools = $("<div></div>"),
      abort = $('<span class="btn btn-default">Avbryt</span>'),
      abort2 = $('<span class="btn btn-default">Avbryt</span>'),
      label = $(`<label for="${id}">Expanderad vid start&nbsp;</label>`),
      label2 = $(`<label for="${id2}">Toggla alla-knapp&nbsp;</label>`),
      label3 = $(`<label for="${id3}">Synlig vid start&nbsp;</label><br />`),
      label4 = $(`<label for="${id4}">Redigera snabbval&nbsp;</label><br />`),
      label5 = $(`<br /><label for="${id6}">Tillträde</label><br />`),
      label6 = $(`<label for="${id7}">Infobox</label><br />`),
      checkbox = $(`<input id="${id}" type="checkbox"/>`),
      checkbox2 = $(`<input id="${id2}" type="checkbox"/>`),
      checkbox3 = $(`<input id="${id3}" type="checkbox"/>`),
      checkbox4 = $(`<input id="${id4}" type="text" value="Nytt namn"/><br />`),
      remove = $('<span class="fa fa-minus-circle"></span>'),
      input = $("<input />"),
      input2 = $(
        `<input id="${id5}" type="text" placeholder="Ny länk"/><br />`
      ),
      input3 = $(`<input id="${id6}" type="text" /><br />`),
      input4 = $(`<textarea id="${id7}" type="text"></textarea>`),
      expanded = $('<div class="expanded-at-start"></div>'),
      toggled = $('<div class="expanded-at-start"></div>'),
      visible = $('<div class=""></div>'),
      editPreset = $('<div class=""></div>'),
      elem = node.get(0) || {};

    ok.css(btnCSS).click(store);

    layerOk.css(btnCSS).click(saveLayer);

    layerOk2.css(btnCSS).click(saveLayer);

    abort.css(btnCSS).click((e) => {
      node.html(prev);
      reset();
    });

    abort2.css(btnCSS).click((e) => {
      node.html(prev);
      reset();
    });

    if (node.parent().attr("data-expanded")) {
      checkbox.attr("checked", JSON.parse(node.parent().attr("data-expanded")));
    }
    if (node.parent().attr("data-toggled")) {
      checkbox2.attr("checked", JSON.parse(node.parent().attr("data-toggled")));
    }
    if (node.parent().attr("data-visibleatstart")) {
      checkbox3.attr(
        "checked",
        JSON.parse(node.parent().attr("data-visibleatstart"))
      );
    }
    if (node.parent().attr("data-visibleforgroups")) {
      input3.val(node.parent().attr("data-visibleforgroups"));
    }
    if (node.parent().attr("data-infobox")) {
      input4.val(node.parent().attr("data-infobox"));
    }

    if (
      node.parent().attr("data-expanded") !== undefined &&
      node.parent().attr("data-toggled") !== undefined
    ) {
      expanded.append(checkbox, label);
      toggled.append(checkbox2, label2);
    }
    visible.append(checkbox3, label3);

    if (component.state.authActive) {
      visible.append(label5, input3);
    }

    visible.append(label6, input4);
    editPreset.append(label4, checkbox4, input2);

    remove.css({ color: "red", marginRight: "4px" }).click((e) => {
      component.setState({
        alert: true,
        confirm: true,
        alertMessage:
          "Objektet kommer att tas bort från lagermenyn, om det är en grupp som innehåller lager kommer alla undergrupper och ingående lager att tas bort. Är detta ok?",
        confirmAction: () => {
          node.parent().remove();
        },
      });
    });

    // For Group Nodes we want to grab value from data-name attribute, where it's encoded properly.
    const inputValue = node.parent()[0].classList.contains("group-node")
      ? node.parent()[0].attributes.getNamedItem("data-name").value
      : node.html();

    input
      .val(inputValue)
      .keydown((e) => {
        if (e.keyCode === 13) {
          store();
        }
      })
      .css({
        marginButtom: "4px",
        padding: "4px",
      });

    tools.css({
      marginLeft: "13px",
      marginTop: "7px",
    });

    tools.append(ok, abort, toggled, expanded);
    layerTools.append(visible, layerOk, abort);
    presetTools.append(editPreset, layerOk2, abort2);

    if (node.hasClass("group-name")) {
      node.html(input).after(tools).before(remove);
    }

    if (node.hasClass("layer-name") && !elem.editing) {
      elem.editing = true;
      node.before(remove).after(layerTools);
    }

    if (node.hasClass("preset-name") && !elem.editing) {
      elem.editing = true;
      node.before(remove).after(presetTools);
    }
  }

  var enableEdit = (e) => {
    var node = $(e.target);

    if (node.hasClass("group-name")) {
      edit(node, e);
    }

    if (node.hasClass("layer-name")) {
      edit(node, e);
    }

    if (node.hasClass("preset-name")) {
      edit(node, e);
    }
  };

  var onClick = (e) => {
    enableEdit(e);
    e.stopPropagation();
  };

  this.off("click");
  this.on("click", onClick);
};

/**
 *
 */
class Menu extends Component {
  constructor() {
    super();
    this.state = {
      adGroups: [],
      isHidden: true,
      drawOrder: false,
      layerMenu: true,
      addedLayers: [],
      maps: [],
      active: true,
      visibleAtStart: true,
      visibleAtStartMobile: false,
      backgroundSwitcherBlack: true,
      backgroundSwitcherWhite: true,
      enableOSM: false,
      showBreadcrumbs: false,
      showDrawOrderView: false,
      showQuickAccess: false,
      enableSystemLayersSwitch: false,
      lockDrawOrderBaselayer: false,
      drawOrderViewInfoText: "",
      enableQuickAccessTopics: false,
      quickAccessTopicsInfoText: "",
      enableUserQuickAccessFavorites: false,
      userQuickAccessFavoritesInfoText: "",
      enableTransparencySlider: true,
      instruction: "",
      dropdownThemeMaps: false,
      themeMapHeaderCaption: "Temakartor",
      visibleForGroups: [],
      adList: null,
      target: "toolbar",
      position: "left",
      width: "",
      height: "",
      title: "Innehåll",
      description: "Välj innehåll att visa i kartan",
      quickLayersPresets: [],
      importedLayers: [],
      importedMetadata: {},
    };
    this.titleRef = React.createRef();
    this.authorRef = React.createRef();
    this.descriptionRef = React.createRef();
    this.keywordsRef = React.createRef();
    this.fileInputRef = React.createRef();
  }

  /**
   *
   */
  init() {
    this.props.model.set("config", this.props.config);
    this.load("maps");
    this.load("layers");
    this.load("auth");

    this.props.model.on("change:urlMapConfig", () => {
      this.setState({
        reset: true,
      });

      this.load("layermenu", () => {
        const existingConfig = this.props.model.get("layerMenuConfig");
        this.setState({
          reset: false,
          active: existingConfig.active,
          visibleAtStart:
            existingConfig.visibleAtStart ?? this.state.visibleAtStart,
          visibleAtStartMobile:
            existingConfig.visibleAtStartMobile ??
            this.state.visibleAtStartMobile,
          backgroundSwitcherBlack:
            existingConfig.backgroundSwitcherBlack ??
            this.state.backgroundSwitcherBlack,
          backgroundSwitcherWhite:
            existingConfig.backgroundSwitcherWhite ??
            this.state.backgroundSwitcherWhite,
          enableOSM: existingConfig.enableOSM ?? this.state.enableOSM,
          showBreadcrumbs:
            existingConfig.showBreadcrumbs ?? this.state.showBreadcrumbs,
          showDrawOrderView:
            existingConfig.showDrawOrderView ?? this.state.showDrawOrderView,
          showQuickAccess:
            existingConfig.showQuickAccess ?? this.state.showQuickAccess,
          enableSystemLayersSwitch:
            existingConfig.enableSystemLayersSwitch ??
            this.state.enableSystemLayersSwitch,
          lockDrawOrderBaselayer:
            existingConfig.lockDrawOrderBaselayer ??
            this.state.lockDrawOrderBaselayer,
          drawOrderViewInfoText:
            existingConfig.drawOrderViewInfoText ??
            this.state.drawOrderViewInfoText,
          enableQuickAccessTopics:
            existingConfig.enableQuickAccessTopics ??
            this.state.enableQuickAccessTopics,
          quickAccessTopicsInfoText:
            existingConfig.quickAccessTopicsInfoText ??
            this.state.quickAccessTopicsInfoText,
          enableUserQuickAccessFavorites:
            existingConfig.enableUserQuickAccessFavorites ??
            this.state.enableUserQuickAccessFavorites,
          userQuickAccessFavoritesInfoText:
            existingConfig.userQuickAccessFavoritesInfoText ??
            this.state.userQuickAccessFavoritesInfoText,
          enableTransparencySlider:
            existingConfig.enableTransparencySlider ??
            this.state.enableTransparencySlider,
          instruction: existingConfig.instruction,
          dropdownThemeMaps:
            existingConfig.dropdownThemeMaps ?? this.state.dropdownThemeMaps,
          themeMapHeaderCaption: existingConfig.themeMapHeaderCaption,
          visibleForGroups: existingConfig.visibleForGroups
            ? existingConfig.visibleForGroups
            : [],
          target: existingConfig.target || "toolbar",
          position: existingConfig.position || "left",
          width: existingConfig.width || "",
          height: existingConfig.height || "",
          title: existingConfig.title || "",
          description: existingConfig.description || "",
          quickLayersPresets: existingConfig.quickLayersPresets || [],
        });
        $(".tree-view li").editable(this);
        $(".tree-view > ul").sortable();
      });
    });

    this.props.model.on("change:layers", () => {
      this.setState({
        layers: this.props.model.get("layers"),
      });
    });

    this.props.model.on("change:layerMenuConfig", () => {
      this.setState({
        layerMenuConfig: this.props.model.get("layerMenuConfig"),
      });

      setTimeout(() => {
        this.setState({
          layers: this.props.model.get("layers"),
        });
      }, 0);

      $(".tree-view li").editable(this);
      $(".tree-view > ul").sortable();
    });

    defaultState.layers = this.props.model.get("layers");
    this.setState(defaultState);
  }

  /**
   *
   */
  update() {
    $(".tree-view li").editable(this);
    $(".tree-view > ul").sortable();
  }

  /**
   *
   */
  componentDidMount() {
    this.init();
  }

  /**
   *
   */

  /**
   *
   */
  componentWillUnmount() {
    this.props.model.off("change:layers");
    this.props.model.off("change:urlMapConfig");
    this.props.model.off("change:layerMenuConfig");
  }

  /**
   *
   */
  createGuid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return (
      s4() +
      s4() +
      "-" +
      s4() +
      "-" +
      s4() +
      "-" +
      s4() +
      "-" +
      s4() +
      s4() +
      s4()
    );
  }

  /**
   *
   */
  load(type, callback) {
    switch (type) {
      case "auth":
        this.props.model.getAuthSetting((auth) => {
          this.setState({ authActive: auth });
        });
        break;
      case "maps":
        this.props.model.loadMaps((maps) => {
          this.setState({
            maps: maps,
          });
          if (callback) callback();
        });
        break;
      case "layers":
        this.props.model.getConfig(
          this.props.model.get("config").url_layers,
          (data) => {
            var layers = [];
            data.wmslayers.forEach((l) => {
              l.type = "WMS";
            });
            data.wmtslayers.forEach((l) => {
              l.type = "WMTS";
            });
            data.arcgislayers.forEach((l) => {
              l.type = "ArcGIS";
            });
            data.vectorlayers.forEach((l) => {
              l.type = "Vector";
            });
            layers = data.wmslayers
              .concat(data.wmtslayers)
              .concat(data.arcgislayers)
              .concat(data.vectorlayers);
            layers.sort((a, b) => {
              var d1 = parseInt(a.date, 10),
                d2 = parseInt(b.date, 10);
              return d1 === d2 ? 0 : d1 < d2 ? 1 : -1;
            });
            this.props.model.set("layers", layers);
            if (callback) callback();
          }
        );
        break;
      case "layermenu":
        this.props.model.getConfig(
          this.props.model.get("urlMapConfig"),
          (data) => {
            this.props.model.set("projectionConfig", data.projection);
            this.props.model.set("toolConfig", data.tools);
            this.props.model.set("mapConfig", data.map);
            this.props.model.set(
              "layerMenuConfig",
              data.tools.find((tool) => tool.type === "layerswitcher").options
            );
            if (callback) callback();
          }
        );
        break;
      default:
        break;
    }
  }

  /**
   *
   */
  filterLayers(e) {
    this.setState({
      filter: e.target.value,
    });
  }

  /**
   *
   */
  getLayersWithFilter() {
    return this.props.model.get("layers").filter((layer) => {
      const caption = layer.caption.toLowerCase();
      const internalLayerName = layer.internalLayerName?.toLowerCase() || "";
      const filter = this.state.filter.toLowerCase();
      return caption.includes(filter) || internalLayerName.includes(filter);
    });
  }

  /**
   *
   */
  getLayerNameFromIdForDisplay(id) {
    var layer = this.props.model.get("layers").find((layer) => layer.id === id);
    let ret = "";
    if (layer) {
      if (layer.internalLayerName?.length > 0) {
        ret = layer.internalLayerName;
      } else {
        ret = layer.caption;
      }
    } else {
      ret = `---[layer id ${id} not found]---`;
    }
    return ret;
  }

  /**
   *
   */
  parseSettings() {
    var settings = {
      groups: [],
      baselayers: [],
      quickLayersPresets: this.state.quickLayersPresets,
      active: this.state.active,
      visibleAtStart: this.state.visibleAtStart,
      visibleAtStartMobile: this.state.visibleAtStartMobile,
      backgroundSwitcherBlack: this.state.backgroundSwitcherBlack,
      backgroundSwitcherWhite: this.state.backgroundSwitcherWhite,
      enableOSM: this.state.enableOSM,
      showBreadcrumbs: this.state.showBreadcrumbs,
      showDrawOrderView: this.state.showDrawOrderView,
      showQuickAccess: this.state.showQuickAccess,
      enableSystemLayersSwitch: this.state.enableSystemLayersSwitch,
      lockDrawOrderBaselayer: this.state.lockDrawOrderBaselayer,
      drawOrderViewInfoText: this.state.drawOrderViewInfoText,
      enableQuickAccessTopics: this.state.enableQuickAccessTopics,
      quickAccessTopicsInfoText: this.state.quickAccessTopicsInfoText,
      enableUserQuickAccessFavorites: this.state.enableUserQuickAccessFavorites,
      userQuickAccessFavoritesInfoText:
        this.state.userQuickAccessFavoritesInfoText,
      instruction: this.state.instruction,
      dropdownThemeMaps: this.state.dropdownThemeMaps,
      themeMapHeaderCaption: this.state.themeMapHeaderCaption,
      visibleForGroups: this.state.visibleForGroups.map(
        Function.prototype.call,
        String.prototype.trim
      ),
      target: this.state.target,
      position: this.state.position,
      width: this.state.width,
      height: this.state.height,
      title: this.state.title,
      description: this.state.description,
    };

    var roots = $(".tree-view > ul > li");
    let that = this;
    function layers(node) {
      return $(node)
        .find("> ul > li.layer-node")
        .toArray()
        .map((node) => {
          let infobox = node.dataset.infobox ? node.dataset.infobox : "";
          if (that.state.authActive) {
            let visibleForGroups = node.dataset.visibleforgroups
              ? node.dataset.visibleforgroups.split(",")
              : [];
            if (Array.isArray(visibleForGroups)) {
              visibleForGroups = visibleForGroups.map(
                Function.prototype.call,
                String.prototype.trim
              );
            } else {
              visibleForGroups = String.prototype.trim(visibleForGroups);
            }
            return {
              id: node.dataset.id,
              drawOrder: node.dataset.draworder
                ? parseInt(node.dataset.draworder)
                : 1000,
              visibleAtStart: checkIfTrue(node.dataset.visibleatstart),
              visibleForGroups: visibleForGroups || [],
              infobox: infobox || "",
            };
          } else {
            return {
              id: node.dataset.id,
              drawOrder: node.dataset.draworder
                ? parseInt(node.dataset.draworder)
                : 1000,
              visibleAtStart: checkIfTrue(node.dataset.visibleatstart),
              infobox: infobox || "",
            };
          }
        });
    }

    function checkIfTrue(value) {
      return value === "true";
    }

    function groups(node) {
      var groups = [];
      $(node)
        .find("> ul > li.group-node")
        .toArray()
        .forEach((node) => {
          groups.push(groupItem(node));
        });
      return groups;
    }

    function groupItem(node) {
      function getParent(node) {
        var parent = $(node).parents(".group-node").first();
        if (parent.length === 1) {
          return parent[0].dataset.id;
        }
        return "-1";
      }
      return {
        id: node.dataset.id,
        type: node.dataset.type,
        name: node.dataset.name,
        toggled: checkIfTrue(node.dataset.toggled),
        expanded: checkIfTrue(node.dataset.expanded),
        parent: getParent(node),
        layers: layers(node),
        groups: groups(node),
      };
    }

    roots.toArray().forEach((root) => {
      let visibleForGroups = root.dataset.visibleforgroups
        ? root.dataset.visibleforgroups.split(",")
        : [];
      if (Array.isArray(visibleForGroups)) {
        visibleForGroups = visibleForGroups.map(
          Function.prototype.call,
          String.prototype.trim
        );
      } else {
        visibleForGroups = String.prototype.trim(visibleForGroups);
      }

      if (this.state.authActive) {
        root.dataset.type === "layer"
          ? settings.baselayers.push({
              id: root.dataset.id,
              visibleAtStart: checkIfTrue(root.dataset.visibleatstart),
              drawOrder: 0,
              visibleForGroups: visibleForGroups || [],
              infobox: "",
            })
          : settings.groups.push(groupItem(root));
      } else {
        root.dataset.type === "layer"
          ? settings.baselayers.push({
              id: root.dataset.id,
              visibleAtStart: checkIfTrue(root.dataset.visibleatstart),
              drawOrder: 0,
              infobox: "",
            })
          : settings.groups.push(groupItem(root));
      }
    });
    return settings;
  }
  /**
   *
   */
  parseDrawSettings() {
    var result = [],
      layers = $(".tree-view > ul > li"),
      j = layers.length;
    layers.each((i, layer) => {
      result.push({
        drawOrder: j,
        id: $(layer).data("id").toString(),
      });
      j--;
    });
    console.log("result: ", result);
    return result;
  }

  /**
   *
   */
  save(settings) {
    this.props.model.updateConfig(settings, (success) => {
      if (success) {
        this.setState({
          reset: true,
        });

        this.props.model.set({ layerMenuConfig: settings });

        this.setState({
          reset: false,
        });

        $(".tree-view li").editable(this);
        $(".tree-view > ul").sortable();

        this.setState({
          content: "mapsettings",
          alert: true,
          alertMessage: "Uppdateringen lyckades.",
        });
      } else {
        this.setState({
          alert: true,
          alertMessage: "Uppdateringen misslyckades.",
        });
      }
    });
  }

  /**
   *
   */
  saveSettings() {
    this.save(this.parseSettings());
  }

  /**
   *
   */
  saveDrawOrder() {
    var settings = this.parseDrawSettings();

    settings.forEach((setting) => {
      var layer = this.props.model.findLayerInConfig(setting.id);
      if (layer) {
        layer.drawOrder = setting.drawOrder;
      }
    });

    var config = this.props.model.get("layerMenuConfig");

    this.props.model.updateConfig(config, (success) => {
      if (success) {
        this.setState({
          content: "mapsettings",
          alert: true,
          alertMessage: "Uppdateringen lyckades.",
        });
        this.forceUpdate();
      } else {
        this.setState({
          alert: true,
          alertMessage: "Uppdateringen misslyckades.",
        });
      }
    });
  }

  /**
   *
   */
  saveQuickLayersPresets() {
    // Get the current configuration.
    var config = this.props.model.get("layerMenuConfig");

    // Update the quickLayersPresets property in the configuration.
    config.quickLayersPresets = this.state.quickLayersPresets;

    // Save the updated configuration.
    this.props.model.updateConfig(config, (success) => {
      if (success) {
        this.setState({
          content: "mapsettings",
          alert: true,
          alertMessage: "Uppdateringen lyckades.",
        });
        this.forceUpdate();
      } else {
        this.setState({
          alert: true,
          alertMessage: "Uppdateringen misslyckades.",
        });
      }
    });
  }

  /**
   *
   */
  isLayerIncludedInConfig(id) {
    return $('.tree-view li.layer-node[data-id="' + id + '"]').length > 0;
  }

  createLayer(id) {
    var layerName = this.getLayerNameFromIdForDisplay(id);

    var layer = $(`
      <li
        class="layer-node"
        data-id=${id}
        data-type="layer">
        <span class="layer-name">${layerName}</span>
      </li>
    `);

    $(".tree-view > ul").prepend(layer);
    layer.editable(this);
    this.forceUpdate();
  }

  /**
   *
   */
  createGroup(name, expanded, toggled) {
    var id = this.createGuid();
    var group = $(`
      <li
        class="group-node"
        data-id="${id}"
        data-type="group"
        data-toggled="${toggled}"
        data-expanded="${expanded}"
        data-name="${name}">
        <span class="group-name">${name}</span>
        <ul></ul>
      </li>
      `);
    $(".tree-view > ul").prepend(group);
    group.editable(this);
  }

  /**
   *
   */
  addLayerToMenu(id, layer, included) {
    if (included) {
      this.setState({
        alert: true,
        confirm: false,
        alertMessage:
          "Detta lager är redan tillagt i lagerlistan. Klicka på lagret i lagerlistan och därefter på den röda symbolen för att ta bort det.",
        confirmAction: () => {},
      });
      return;
    }
    this.createLayer(id);
  }

  /**
   *
   */
  renderLayersFromConfig(layers) {
    layers = this.state.filter
      ? this.getLayersWithFilter()
      : this.props.model.get("layers");

    var startsWith = [];
    var alphabetically = [];

    if (this.state.filter) {
      layers.forEach((layer) => {
        layer.caption.toLowerCase().indexOf(this.state.filter.toLowerCase()) ===
          0 ||
        layer.internalLayerName
          ?.toLowerCase()
          .indexOf(this.state.filter.toLowerCase()) === 0
          ? startsWith.push(layer)
          : alphabetically.push(layer);
      });

      startsWith.sort(function (a, b) {
        let aName = a.internalLayerName ? a.internalLayerName : a.caption;
        aName = aName.toLowerCase();
        let bName = b.internalLayerName ? b.internalLayerName : b.caption;
        bName = bName.toLowerCase();
        if (aName < bName) return -1;
        if (aName > bName) return 1;
        return 0;
      });

      alphabetically.sort(function (a, b) {
        let aName = a.internalLayerName ? a.internalLayerName : a.caption;
        aName = aName.toLowerCase();
        let bName = b.internalLayerName ? b.internalLayerName : b.caption;
        bName = bName.toLowerCase();
        if (aName < bName) return -1;
        if (aName > bName) return 1;
        return 0;
      });

      layers = startsWith.concat(alphabetically);
    }

    return layers.map((layer, i) => {
      var included = this.isLayerIncludedInConfig(layer.id);
      var cls = "fa fa-square-o";

      if (included) {
        cls = "fa fa-check-square-o";
      }

      var displayType = "";

      switch (layer.type) {
        case "WMS":
          displayType = "";
          break;
        case "WMTS":
          displayType = "(WMTS)";
          break;
        case "ArcGIS":
          displayType = "(ArcGIS)";
          break;
        case "Vector":
          displayType = "(Vektor)";
          break;
        default:
          break;
      }

      return (
        <li
          className="layer-item"
          onClick={() => this.addLayerToMenu(layer.id, layer, included)}
          key={i}
        >
          <span className={cls} />
          &nbsp;
          <span className="main-box">
            {layer.internalLayerName?.length > 0
              ? layer.internalLayerName
              : layer.caption}{" "}
            {displayType}
          </span>
        </li>
      );
    });
  }

  /**
   *
   */
  renderLayerMenu() {
    if (!this.props.model.get("layerMenuConfig")) return null;
    var layerMenuConfig = this.props.model.get("layerMenuConfig"),
      that = this;

    function buildTree(config) {
      function leafs(group) {
        var leafs = [],
          layers = group.layers || group;

        layers.forEach((layer, i) => {
          var visible = false;
          if (typeof layer === "object") {
            if (layer.visibleAtStart === "false") {
              visible = false;
            } else {
              visible = layer.visibleAtStart;
            }
          }
          var className = visible ? "layer-node visible" : "layer-node";
          let infobox = layer.infobox ? layer.infobox : "";
          if (that.state.authActive) {
            let visibleForGroups = layer.visibleForGroups
              ? layer.visibleForGroups
              : [];

            leafs.push(
              <li
                className={className}
                key={i}
                data-id={typeof layer === "object" ? layer.id : layer}
                data-draworder={typeof layer === "object" ? layer.drawOrder : 0}
                data-visibleatstart={visible}
                data-type="layer"
                data-visibleforgroups={
                  Array.isArray(visibleForGroups)
                    ? visibleForGroups.join(",")
                    : visibleForGroups
                }
                data-infobox={infobox}
              >
                <span className="layer-name">
                  {that.getLayerNameFromIdForDisplay(
                    typeof layer === "object" ? layer.id : layer
                  )}
                </span>
              </li>
            );
          } else {
            leafs.push(
              <li
                className={className}
                key={i}
                data-id={typeof layer === "object" ? layer.id : layer}
                data-draworder={typeof layer === "object" ? layer.drawOrder : 0}
                data-visibleatstart={visible}
                data-type="layer"
                data-infobox={infobox}
              >
                <span className="layer-name">
                  {that.getLayerNameFromIdForDisplay(
                    typeof layer === "object" ? layer.id : layer
                  )}
                </span>
              </li>
            );
          }
        });
        if (group.hasOwnProperty("groups") && group.groups) {
          leafs.push(roots(group.groups));
        }
        return leafs;
      }

      function roots(groups) {
        return groups.map((group, i) => {
          return (
            <li
              className="group-node"
              key={i}
              data-id={group.id}
              data-type="group"
              data-expanded={group.expanded}
              data-toggled={group.toggled}
              data-name={group.name}
            >
              <span className="group-name">{group.name}</span>
              <ul>{leafs(group)}</ul>
            </li>
          );
        });
      }

      return (
        <ul ref="layerMenu">
          {leafs(config.baselayers)}
          {roots(config.groups)}
        </ul>
      );
    }

    if (this.state.reset) {
      return <div />;
    }

    return buildTree(layerMenuConfig);
  }

  /**
   *
   */
  toggleDrawOrderMenu() {
    this.setState({
      drawOrder: true,
      layerMenu: false,
      mapOptions: false,
      toolOptions: false,
      quickLayers: false,
    });

    setTimeout(() => {
      $(".tree-view > ul").sortable();
      this.setState({
        drawOrder: true,
      });
    }, 0);
  }

  /**
   *
   */
  toggleLayerMenu() {
    this.setState({
      layerMenu: true,
      drawOrder: false,
      mapOptions: false,
      toolOptions: false,
      quickLayers: false,
    });

    setTimeout(() => {
      this.update();
      this.setState({
        layerMenu: true,
      });
    }, 0);
  }
  /**
   *
   */
  toggleMapOptionsMenu() {
    this.setState({
      drawOrder: false,
      layerMenu: false,
      mapOptions: true,
      toolOptions: false,
      quickLayers: false,
    });
  }
  /**
   *
   */
  toggleToolMenu() {
    this.setState({
      drawOrder: false,
      layerMenu: false,
      mapOptions: false,
      toolOptions: true,
      quickLayers: false,
    });
  }
  /**
   *
   */
  togglequickLayers() {
    this.setState({
      drawOrder: false,
      layerMenu: false,
      mapOptions: false,
      toolOptions: false,
      quickLayers: true,
    });
  }

  setSelectedConfig(e) {
    var url = this.props.model.get("config").url_map + "/" + e.target.value;
    this.props.model.set({
      urlMapConfig: url,
      mapFile: e.target.value,
    });
  }

  /**
   *
   */
  renderDrawOrder() {
    function flatten(config) {
      var layerList = [];
      function fromGroups(groups) {
        if (groups) {
          return groups.reduce((list, n, index, array) => {
            var g = array[index];
            if (g.hasOwnProperty("groups") && g.groups) {
              list = list.concat(fromGroups(g.groups));
            }
            return list.concat(g.layers);
          }, []);
        }
      }
      layerList = layerList.concat(fromGroups(config.groups));
      return layerList;
    }

    var layers = flatten(this.props.model.get("layerMenuConfig"));

    layers.sort((a, b) =>
      a.drawOrder === b.drawOrder ? 0 : a.drawOrder < b.drawOrder ? -1 : 1
    );
    layers = layers.reverse();

    return layers.map((layer, i) => {
      var name = this.getLayerNameFromIdForDisplay(layer.id);
      return (
        <li
          className="layer-node"
          key={Math.round(Math.random() * 1e6)}
          data-id={layer.id}
        >
          {name}
        </li>
      );
    });
  }

  handleInputChange = (event) => {
    const target = event.target;
    const name = target.name;
    var value = target.type === "checkbox" ? target.checked : target.value;

    if (typeof value === "string" && /^[\d., ]+$/.test(value)) {
      value = Number(value.replace(/,/g, "").replace(/ /g, ""));
    }

    if (name === "instruction") {
      value = btoa(value);
    }

    this.setState({
      [name]: value,
    });
  };

  /**
   * Hanterar event för inmatningsfält för Active Directory-grupper
   * @param {*} event
   */
  handleAuthGrpsChange(event) {
    const target = event.target;
    const value = target.value;
    let groups = [];

    try {
      groups = value.split(",");
    } catch (error) {
      console.log(`Någonting gick fel: ${error}`);
    }

    this.setState({
      visibleForGroups: value !== "" ? groups : [],
    });
  }

  /**
   * Visar / döljer lista över tillgängliga AD-grupper
   */
  toggleHidden() {
    if (this.state.authActive) {
      this.setState({
        isHidden: !this.state.isHidden,
      });

      this.state.isHidden
        ? this.renderAdList()
        : this.setState({ adList: null });
    }
  }

  /**
   * Renderar lista över tillgängliga AD-grupper då modellen fått dessa från backend
   */
  renderAdList() {
    if (this.state.authActive) {
      this.props.model.fetchADGroups((grps) => {
        this.setState({ adGroups: grps });

        this.setState({
          adList: (
            <ListProperties
              properties={this.state.adGroups}
              show={this.state.isHidden}
            />
          ),
        });
      });
    }
  }

  /**
   * Renderar inmatningsfält för AD-grupper
   */
  renderAuthGrps() {
    if (this.state.authActive) {
      return (
        <div className="col-sm-12">
          <label htmlFor="authGroups">
            Tillträde &nbsp;
            <i
              className="fa fa-question-circle"
              data-toggle="tooltip"
              title="Ange AD-grupper separerade med kommatecken"
            />
          </label>
          <input
            id="authGroups"
            name="authGroups"
            type="text"
            onChange={(e) => {
              this.handleAuthGrpsChange(e);
            }}
            value={this.state.visibleForGroups}
          />
          <i
            className="fa fa-bars"
            data-toggle="tooltip"
            title="Visa tillgängliga AD-grupper"
            onClick={() => {
              this.toggleHidden();
            }}
          />
        </div>
      );
    } else {
      return null;
    }
  }

  /**
   * Renderar konfigurationsmöjlighet för temakartor-dropdown
   */
  renderThemeMapCheckbox() {
    return (
      <div>
        <input
          id="dropdownThemeMaps"
          name="dropdownThemeMaps"
          type="checkbox"
          onChange={this.handleInputChange}
          checked={this.state.dropdownThemeMaps}
        />
        &nbsp;
        <label className="long-label" htmlFor="dropdownThemeMaps">
          Visa kartan i lista över tillgängliga kartor
        </label>
      </div>
    );
  }

  /**
   * Renderar inmatningsfält för rubriksättning till temakartor
   */
  renderThemeMapHeaderInput() {
    return (
      <div className="row">
        <div className="col-sm-12">
          <label htmlFor="themeMapHeaderCaption">
            Kartans titel i listan över tillgängliga kartor
          </label>
          <input
            id="themeMapHeaderCaption"
            name="themeMapHeaderCaption"
            type="text"
            value={this.state.themeMapHeaderCaption}
            onChange={(e) => {
              this.setState({ themeMapHeaderCaption: e.target.value });
            }}
          />
        </div>
      </div>
    );
  }

  /**
   * Renders method for adding and removing quick layers.
   */
  renderQuickLayers() {
    let filteredLayers = this.state.quickLayersPresets;

    // Apply filter only when filterString is not empty.
    if (this.state.filterString) {
      filteredLayers = filteredLayers.filter((layer) =>
        layer.title.includes(this.state.filterString)
      );
    }

    return filteredLayers.map((layer, i) => {
      return (
        <li className="layer-item" key={i}>
          <span className="main-box">{layer.title}</span>
          <i
            className="fa fa-trash"
            onClick={(event) => {
              event.stopPropagation();
              this.deleteQuickLayerFromList(layer.id);
            }}
          />
        </li>
      );
    });
  }

  filterQuickLayers(e) {
    this.setState({
      filterString: e.target.value,
    });
  }

  cancelInput = () => {
    // Clear the input fields.
    this.titleRef.current.value = "";
    this.authorRef.current.value = "";
    this.descriptionRef.current.value = "";
    this.keywordsRef.current.value = "";

    // Clear the file input.
    this.fileInputRef.current.value = "";

    // Clear the state.
    this.setState({
      importMessage: "",
      importedLayers: [],
      importedMetadata: {},
    });
  };

  deleteQuickLayerFromList(id) {
    this.setState((prevState) => ({
      quickLayersPresets: prevState.quickLayersPresets.filter(
        (layer) => layer.id !== id
      ),
    }));
  }

  addQuickLayer = () => {
    const title = this.titleRef.current.value;
    const author = this.authorRef.current.value;
    const description = this.descriptionRef.current.value;
    const keywords = this.keywordsRef.current.value.split(",");

    // Check if title and importedLayers are filled.
    if (
      title === "" ||
      this.state.importedLayers.length === 0 ||
      !this.state.importStatus
    ) {
      alert(
        "Ange titel och importera en giltig JSON-fil innan du lägger till ett nytt snabblager."
      );
      return;
    }

    const newLayer = {
      id: uuidv4(),
      title: title,
      author: author,
      description: description,
      keywords: keywords,
      layers: this.state.importedLayers,
      metadata: this.state.importedMetadata,
    };

    // Update the state.
    this.setState((prevState) => ({
      quickLayersPresets: [...prevState.quickLayersPresets, newLayer],
      importedLayers: [],
      importedMetadata: {},
      importStatus: false,
      importMessage: "",
    }));

    // Clear the input fields.
    this.titleRef.current.value = "";
    this.authorRef.current.value = "";
    this.descriptionRef.current.value = "";
    this.keywordsRef.current.value = "";

    // Clear the file input.
    this.fileInputRef.current.value = "";
  };

  importJSON = (event) => {
    const fileReader = new FileReader();
    fileReader.readAsText(event.target.files[0], "UTF-8");
    fileReader.onload = (e) => {
      try {
        const result = JSON.parse(e.target.result);
        if (!this.validateImportedJSON(result)) {
          this.setState({
            importStatus: false,
            importMessage: "Filen är felaktig och kunde inte läsas in.",
          });
        } else {
          this.setState({
            importedLayers: result.layers,
            importedMetadata: result.metadata,
            importStatus: true,
            importMessage: "Filen är korrekt och fungerar.",
          });
        }
      } catch (error) {
        this.setState({
          importStatus: false,
          importMessage: "Filen är felaktig och kunde inte läsas in.",
        });
      }
    };
  };

  validateImportedJSON(json) {
    if (!json) return false;

    // Check metadata properties.
    if (!json.metadata || typeof json.metadata !== "object") {
      return false;
    }
    const requiredMetadataProps = [
      "savedAt",
      "numberOfLayers",
      "title",
      "description",
    ];
    if (
      !requiredMetadataProps.every((prop) => json.metadata.hasOwnProperty(prop))
    ) {
      return false;
    }

    // Check layers properties.
    if (!json.layers || !Array.isArray(json.layers)) {
      return false;
    }
    const requiredLayerProps = [
      "id",
      "visible",
      "subLayers",
      "opacity",
      "drawOrder",
    ];
    if (
      !json.layers.every((layer) =>
        requiredLayerProps.every((prop) => layer.hasOwnProperty(prop))
      )
    ) {
      return false;
    }

    return true;
  }

  /**
   *
   */
  renderArticleContent() {
    if (this.state.mapOptions) {
      return <MapOptions parent={this} model={this.props.model} />;
    }
    if (this.state.toolOptions) {
      return <ToolOptions parent={this} model={this.props.model} />;
    }
    if (this.state.drawOrder) {
      return (
        <div>
          <aside>Drag och släpp lager för att redigera ritordning.</aside>
          <article>
            <fieldset className="tree-view">
              <legend>Hantera ritordning</legend>
              <ColorButtonBlue
                variant="contained"
                className="btn"
                onClick={(e) => this.saveDrawOrder(e)}
                startIcon={<SaveIcon />}
              >
                Spara
              </ColorButtonBlue>
              &nbsp;
              <ul>{this.renderDrawOrder()}</ul>
              <ColorButtonBlue
                variant="contained"
                className="btn"
                onClick={(e) => this.saveDrawOrder(e)}
                startIcon={<SaveIcon />}
              >
                Spara
              </ColorButtonBlue>
            </fieldset>
          </article>
        </div>
      );
    }
    if (this.state.layerMenu) {
      return (
        <div>
          <aside>
            <input
              placeholder="filtrera"
              type="text"
              onChange={(e) => this.filterLayers(e)}
            />
            <ul className="config-layer-list">
              {this.renderLayersFromConfig()}
            </ul>
          </aside>
          <article>
            <fieldset className="tree-view">
              <legend>Hantera lagermeny</legend>
              <ColorButtonBlue
                variant="contained"
                className="btn"
                onClick={(e) => this.saveSettings(e)}
                startIcon={<SaveIcon />}
              >
                Spara
              </ColorButtonBlue>
              &nbsp;
              <div>
                <input
                  id="active"
                  name="active"
                  type="checkbox"
                  onChange={this.handleInputChange}
                  checked={this.state.active}
                />
                &nbsp;
                <label className="long-label" htmlFor="active">
                  Aktiverad
                </label>
              </div>
              <div className="separator">Fönsterinställningar</div>
              <div className="row">
                <div className="col-sm-12">
                  <label htmlFor="target">
                    Verktygsplacering{" "}
                    <i
                      className="fa fa-question-circle"
                      data-toggle="tooltip"
                      title="Avgör om verktyget visas som en Widget Plugin (om 'left' eller 'right' anges här) eller Drawer Plugin (om 'toolbar' anges här)."
                    />
                  </label>
                  <select
                    id="target"
                    name="target"
                    className="control-fixed-width"
                    onChange={(e) => {
                      this.handleInputChange(e);
                    }}
                    value={this.state.target}
                  >
                    <option value="toolbar">Drawer</option>
                    <option value="left">Widget left</option>
                    <option value="right">Widget right</option>
                    <option value="control">Control button</option>
                  </select>
                  {/* <input
                    id="target"
                    name="target"
                    type="text"
                    onChange={this.handleInputChange}
                    value={this.state.target}
                  /> */}
                </div>
              </div>
              <div className="row">
                <div className="col-sm-12">
                  <label htmlFor="position">
                    Fönsterplacering{" "}
                    <i
                      className="fa fa-question-circle"
                      data-toggle="tooltip"
                      title="Placering av verktygets fönster. Anges som antingen 'left' eller 'right'."
                    />
                  </label>
                  <select
                    id="position"
                    name="position"
                    className="control-fixed-width"
                    onChange={(e) => {
                      this.handleInputChange(e);
                    }}
                    value={this.state.position}
                  >
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                  </select>
                </div>
              </div>
              <div className="row">
                <div className="col-sm-12">
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
                    onChange={this.handleInputChange}
                    value={this.state.width}
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-sm-12">
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
                    min="0"
                    className="control-fixed-width"
                    onChange={this.handleInputChange}
                    value={this.state.height}
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-sm-12">
                  <label htmlFor="title">
                    Rubrik
                    <br />
                    (Widget Plugin)
                  </label>
                  <input
                    value={this.state.title}
                    type="text"
                    name="title"
                    onChange={this.handleInputChange}
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-sm-12">
                  <label htmlFor="description">
                    Beskrivning
                    <br />
                    (Widget Plugin){" "}
                    <i
                      className="fa fa-question-circle"
                      data-toggle="tooltip"
                      title="Om verktyget visas som widget (inställningen 'Verktygsplacering' sätts till 'left' eller 'right) så kommer denna beskrivning att visas inne i widget-knappen."
                    />
                  </label>
                  <input
                    value={this.state.description}
                    type="text"
                    name="description"
                    onChange={this.handleInputChange}
                  />
                </div>
              </div>
              <div className="separator">Inställningar för Lagerhanteraren</div>
              <div>
                <input
                  id="visibleAtStart"
                  name="visibleAtStart"
                  type="checkbox"
                  onChange={this.handleInputChange}
                  checked={this.state.visibleAtStart}
                />
                &nbsp;
                <label className="long-label" htmlFor="visibleAtStart">
                  Synlig vid start
                </label>
              </div>
              <div>
                <input
                  id="visibleAtStartMobile"
                  name="visibleAtStartMobile"
                  type="checkbox"
                  onChange={this.handleInputChange}
                  checked={this.state.visibleAtStartMobile}
                />
                &nbsp;
                <label className="long-label" htmlFor="visibleAtStartMobile">
                  Synlig vid start (mobil)
                </label>
              </div>
              <div>
                <input
                  id="showBreadcrumbs"
                  name="showBreadcrumbs"
                  type="checkbox"
                  onChange={this.handleInputChange}
                  checked={this.state.showBreadcrumbs}
                />
                &nbsp;
                <label className="long-label" htmlFor="showBreadcrumbs">
                  Visa brödsmulor{" "}
                  <i
                    className="fa fa-question-circle"
                    data-toggle="tooltip"
                    title="När rutan är ikryssad visas små kort längst ned på skärmen, ett för varje lager som är aktivt"
                  />
                </label>
              </div>
              <div>
                <input
                  id="showDrawOrderView"
                  name="showDrawOrderView"
                  type="checkbox"
                  onChange={this.handleInputChange}
                  checked={this.state.showDrawOrderView}
                />
                &nbsp;
                <label className="long-label" htmlFor="showDrawOrderView">
                  Visa en flik med ritordning{" "}
                  <i
                    className="fa fa-question-circle"
                    data-toggle="tooltip"
                    title="När rutan är ikryssad visas en flik i lagerhanteraren för hantering av ritordning."
                  />
                </label>
              </div>
              <div>
                <input
                  id="showQuickAccess"
                  name="showQuickAccess"
                  type="checkbox"
                  onChange={this.handleInputChange}
                  checked={this.state.showQuickAccess}
                />
                &nbsp;
                <label className="long-label" htmlFor="showQuickAccess">
                  Visa en grupp med snabbåtkomst{" "}
                  <i
                    className="fa fa-question-circle"
                    data-toggle="tooltip"
                    title="När rutan är ikryssad visas en grupp för snabbåtkomst i lagerhanteraren."
                  />
                </label>
              </div>
              <div>
                <input
                  id="enableTransparencySlider"
                  name="enableTransparencySlider"
                  type="checkbox"
                  onChange={this.handleInputChange}
                  checked={this.state.enableTransparencySlider}
                />
                &nbsp;
                <label
                  className="long-label"
                  htmlFor="enableTransparencySlider"
                >
                  Visa transparensreglage{" "}
                  <i
                    className="fa fa-question-circle"
                    data-toggle="tooltip"
                    title="Global inställning för att välja om transparensreglage ska vara aktiv eller inte. Om inställningen är aktiv går det då att konfigurera individer lager om transparensreglage ska visas till lagret.  Om denna ruta inte är ikryssad kommer transparensreglage inte visas till någon lager."
                  />
                </label>
              </div>
              <div className="row">
                <div className="col-sm-12">
                  <label htmlFor="instruction">Instruktion</label>
                  <textarea
                    id="instruction"
                    name="instruction"
                    type="text"
                    onChange={this.handleInputChange}
                    value={
                      this.state.instruction ? atob(this.state.instruction) : ""
                    }
                  />
                </div>
              </div>
              <div className="row">{this.renderAuthGrps()}</div>
              <div className="separator">
                Inställningar för flik med ritordning
              </div>
              <div>
                <input
                  id="enableSystemLayersSwitch"
                  name="enableSystemLayersSwitch"
                  type="checkbox"
                  onChange={this.handleInputChange}
                  checked={this.state.enableSystemLayersSwitch}
                />
                &nbsp;
                <label
                  className="long-label"
                  htmlFor="enableSystemLayersSwitch"
                >
                  Visa reglage för systemlager{" "}
                  <i
                    className="fa fa-question-circle"
                    data-toggle="tooltip"
                    title="När rutan är ikryssad visas ett reglage för att slå på och av visningen av systemlager i ritordningslistan."
                  />
                </label>
              </div>
              <div>
                <input
                  id="lockDrawOrderBaselayer"
                  name="lockDrawOrderBaselayer"
                  type="checkbox"
                  onChange={this.handleInputChange}
                  checked={this.state.lockDrawOrderBaselayer}
                />
                &nbsp;
                <label className="long-label" htmlFor="lockDrawOrderBaselayer">
                  Lås ritordning för bakgrundskartor{" "}
                  <i
                    className="fa fa-question-circle"
                    data-toggle="tooltip"
                    title="När rutan är ikryssad är ritordningen för bakgrundskartor låst så att de alltid ligger längst ner. En lås-ikon visas på lagret."
                  />
                </label>
              </div>
              <div className="text-input-label">
                Infotext Flik med ritordning{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Ange en text som ska visas i panelen för ritordning."
                />
                &nbsp;
                <input
                  id="drawOrderViewInfoText"
                  name="drawOrderViewInfoText"
                  type="text"
                  onChange={this.handleInputChange}
                  value={this.state.drawOrderViewInfoText}
                />
              </div>
              <div className="separator">
                Inställningar för grupp med snabbåtkomst
              </div>
              <div>
                <input
                  id="enableQuickAccessTopics"
                  name="enableQuickAccessTopics"
                  type="checkbox"
                  onChange={this.handleInputChange}
                  checked={this.state.enableQuickAccessTopics}
                />
                &nbsp;
                <label className="long-label" htmlFor="enableQuickAccessTopics">
                  Ladda tema{" "}
                  <i
                    className="fa fa-question-circle"
                    data-toggle="tooltip"
                    title="När rutan är ikryssad kan användaren ladda fördefinierade teman till snabbåtkomst."
                  />
                </label>
              </div>
              <div className="text-input-label">
                Infotext Ladda tema{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Ange en text som ska visas i panelen för att ladda tema."
                />
                &nbsp;
                <input
                  id="quickAccessTopicsInfoText"
                  name="quickAccessTopicsInfoText"
                  type="text"
                  onChange={this.handleInputChange}
                  value={this.state.quickAccessTopicsInfoText}
                />
              </div>
              <div>
                <input
                  id="enableUserQuickAccessFavorites"
                  name="enableUserQuickAccessFavorites"
                  type="checkbox"
                  onChange={this.handleInputChange}
                  checked={this.state.enableUserQuickAccessFavorites}
                />
                &nbsp;
                <label
                  className="long-label"
                  htmlFor="enableUserQuickAccessFavorites"
                >
                  Mina favoriter{" "}
                  <i
                    className="fa fa-question-circle"
                    data-toggle="tooltip"
                    title="När rutan är ikryssad kan användaren spara snabbåtkomst till mina favoriter för att kunna ladda vid senare tillfälle."
                  />
                </label>
              </div>
              <div className="text-input-label">
                Infotext Mina favoriter{" "}
                <i
                  className="fa fa-question-circle"
                  data-toggle="tooltip"
                  title="Ange en text som ska visas i panelen för mina favoriter."
                />
                &nbsp;
                <input
                  id="userQuickAccessFavoritesInfoText"
                  name="userQuickAccessFavoritesInfoText"
                  type="text"
                  onChange={this.handleInputChange}
                  value={this.state.userQuickAccessFavoritesInfoText}
                />
              </div>
              <div className="separator">Kartinställningar</div>
              {this.renderThemeMapCheckbox()}
              {this.renderThemeMapHeaderInput()}
              <div className="separator">Inställningar för bakgrundslager</div>
              <div>
                <input
                  id="backgroundSwitcherBlack"
                  name="backgroundSwitcherBlack"
                  type="checkbox"
                  onChange={this.handleInputChange}
                  checked={this.state.backgroundSwitcherBlack}
                />
                &nbsp;
                <label className="long-label" htmlFor="backgroundSwitcherBlack">
                  Svart bakgrundskarta
                </label>
              </div>
              <div>
                <input
                  id="backgroundSwitcherWhite"
                  name="backgroundSwitcherWhite"
                  type="checkbox"
                  onChange={this.handleInputChange}
                  checked={this.state.backgroundSwitcherWhite}
                />
                &nbsp;
                <label htmlFor="backgroundSwitcherWhite">
                  Vit bakgrundskarta
                </label>
              </div>
              <div>
                <input
                  id="enableOSM"
                  name="enableOSM"
                  type="checkbox"
                  onChange={this.handleInputChange}
                  checked={this.state.enableOSM}
                />
                &nbsp;
                <label htmlFor="enableOSM">OpenStreetMap</label>
              </div>
              <div className="separator">Justera lagerhanteraren</div>
              <div className="margined">
                <ColorButtonBlue
                  variant="contained"
                  className="btn"
                  onClick={(e) => this.saveSettings(e)}
                  startIcon={<SaveIcon />}
                >
                  Spara
                </ColorButtonBlue>
                &nbsp;
                <ColorButtonGreen
                  variant="contained"
                  className="btn"
                  onClick={(e) => this.createGroup("Ny grupp", false, false)}
                  startIcon={<CreateNewFolderIcon />}
                >
                  Ny grupp
                </ColorButtonGreen>
              </div>
              {this.renderLayerMenu()}
              <div>
                <ColorButtonBlue
                  variant="contained"
                  className="btn"
                  onClick={(e) => this.saveSettings(e)}
                  startIcon={<SaveIcon />}
                >
                  Spara
                </ColorButtonBlue>
              </div>
            </fieldset>
          </article>
          {this.state.adList}
        </div>
      );
    }

    if (this.state.quickLayers) {
      return (
        <div>
          <aside>
            <input
              placeholder="filtrera"
              type="text"
              onChange={(e) => this.filterQuickLayers(e)}
            />
            <ul className="config-layer-list">{this.renderQuickLayers()}</ul>
          </aside>
          <article>
            <fieldset className="tree-view">
              <legend>Hantera snabblager</legend>
              <div className="row">
                <div className="col-sm-12">
                  <label htmlFor="title">
                    Titel*{" "}
                    <i
                      className="fa fa-question-circle"
                      data-toggle="tooltip"
                      title="Titel på snabblagret visas i kartans lagerhanterare."
                    />
                  </label>
                  <input type="text" name="title" ref={this.titleRef} />
                </div>
              </div>
              <div className="row">
                <div className="col-sm-12">
                  <label htmlFor="title">
                    Ägare{" "}
                    <i
                      className="fa fa-question-circle"
                      data-toggle="tooltip"
                      title="Ägare av snabblagret visas i kartans lagerhanterare."
                    />
                  </label>
                  <input type="text" name="author" ref={this.authorRef} />
                </div>
              </div>
              <div className="row">
                <div className="col-sm-12">
                  <label htmlFor="title">
                    Beskrivning{" "}
                    <i
                      className="fa fa-question-circle"
                      data-toggle="tooltip"
                      title="Beskrivning av snabblagret visas i kartans lagerhanterare."
                    />
                  </label>
                  <input
                    type="text"
                    name="description"
                    ref={this.descriptionRef}
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-sm-12">
                  <label htmlFor="title">
                    Nyckelord{" "}
                    <i
                      className="fa fa-question-circle"
                      data-toggle="tooltip"
                      title="Nyckelord för snabblagret visas i kartans lagerhanterare."
                    />
                  </label>
                  <input type="text" name="keywords" ref={this.keywordsRef} />
                </div>
              </div>
              <div className="row">
                <div className="col-sm-12">
                  <label htmlFor="title">
                    JSON-fil*{" "}
                    <i
                      className="fa fa-question-circle"
                      data-toggle="tooltip"
                      title="JSON-fil som innehåller lagerdefinitioner för snabblagret."
                    />
                  </label>
                  <input
                    type="file"
                    accept=".json"
                    ref={this.fileInputRef}
                    onChange={this.importJSON}
                  />
                </div>
              </div>
              <div className="row">
                <div
                  className="col-sm-12"
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                  }}
                >
                  {this.state.importMessage ? (
                    this.state.importStatus ? (
                      <span>
                        <CheckCircleOutline />
                        &nbsp;
                        <span
                          style={{
                            float: "right",
                          }}
                        >
                          {this.state.importMessage}
                        </span>
                      </span>
                    ) : (
                      <span>
                        <HighlightOffIcon />
                        &nbsp;
                        <span
                          style={{
                            float: "right",
                          }}
                        >
                          {this.state.importMessage}
                        </span>
                      </span>
                    )
                  ) : null}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <ColorButtonBlue
                  variant="contained"
                  className="btn"
                  onClick={this.cancelInput}
                  startIcon={<HighlightOffIcon />}
                >
                  Avbryt
                </ColorButtonBlue>
                &nbsp;
                <ColorButtonBlue
                  variant="contained"
                  className="btn"
                  onClick={(e) => this.saveQuickLayersPresets(e)}
                  startIcon={<SaveIcon />}
                >
                  Spara
                </ColorButtonBlue>
                &nbsp;
                <ColorButtonBlue
                  variant="contained"
                  className="btn"
                  onClick={this.addQuickLayer}
                  startIcon={<AddIcon />}
                >
                  Lägg till
                </ColorButtonBlue>
              </div>
            </fieldset>
          </article>
        </div>
      );
    }
  }

  /**
   *
   */
  getAlertOptions() {
    return {
      visible: this.state.alert,
      message: this.state.alertMessage,
      confirm: this.state.confirm,
      confirmAction: () => {
        this.state.confirmAction();
        this.setState({
          alert: false,
          confirm: false,
          alertMessage: "",
        });
      },
      denyAction: () => {
        this.state.denyAction();
        this.setState({
          alert: false,
          confirm: false,
          alertMessage: "",
        });
      },
      onClick: () => {
        this.setState({
          alert: false,
          alertMessage: "",
        });
      },
    };
  }

  deleteMap() {
    this.setState({
      alert: true,
      confirm: true,
      alertMessage:
        "Vill du verkligen radera kartan '" +
        this.props.model.attributes.mapFile +
        "'?",
      confirmAction: () => {
        this.props.model.deleteMap((err) => {
          var msg = err || "Kartan raderades";
          this.setState({
            content: "mapsettings",
            alert: true,
            alertMessage: msg,
          });
          this.load("maps");
        });
      },
    });
  }

  createMap() {
    var name = this.refs.mapName.value;
    if (!/[^0-9a-zA-Z_]/.test(name) && name.trim().length > 0) {
      this.props.model.createMap(name, (d, s) => {
        if (s === "success") {
          this.setState({
            content: "mapsettings",
            alert: true,
            alertMessage: "En ny karta skapades utan problem.",
          });
          this.load("maps");
        } else {
          this.setState({
            alert: true,
            alertMessage: "Karta kunde INTE skapas.",
          });
          console.error(d);
        }
      });
    } else {
      this.setState({
        alert: true,
        alertMessage:
          "Felaktigt namn på kartan \nInga eller ogiltiga tecken har angivits. \n\nGiltiga tecken: 0-9 a-z A-Z _",
      });
    }
  }

  /**
   *
   */
  render() {
    var options = [];
    if (Array.isArray(this.state.maps)) {
      options = this.state.maps.map((map, i) => <option key={i}>{map}</option>);
    }
    return (
      <section className="tab-pane active">
        <Alert options={this.getAlertOptions()} />
        <div>
          <h1>Kartinställningar</h1>
          <div className="separator set-width">
            <h4>Hantera / Skapa karta</h4>
          </div>
          <div className="map-management">
            <div className="inset-form margined">
              <label>Välj karta</label>
              &nbsp;
              <select
                className="control-fixed"
                onChange={(e) => {
                  this.setSelectedConfig(e);
                }}
                ref="map-chooser"
              >
                {options}
              </select>
              &nbsp;
              <ColorButtonBlue
                startIcon={<OpenInNewIcon />}
                href={`${this.props.config.url_client_ui}?m=${this.props.model.attributes.mapFile}`}
                target="_blank"
              >
                Öppna i nytt fönster
              </ColorButtonBlue>
              &nbsp;
              <ColorButtonRed
                variant="contained"
                className="btn"
                onClick={(e) => this.deleteMap()}
                startIcon={<DeleteIcon />}
              >
                Ta bort karta
              </ColorButtonRed>
            </div>

            <Divider orientation="vertical" flexItem />

            <div className="inset-form map-management-margin-left margined">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  this.createMap(e);
                }}
              >
                <label>Namn</label>
                &nbsp;
                <input type="text" ref="mapName" />
                &nbsp;
                <ColorButtonGreen
                  variant="contained"
                  className="btn"
                  type="submit"
                  startIcon={<AddIcon />}
                >
                  Skapa ny karta
                </ColorButtonGreen>
              </form>
            </div>
          </div>

          <div className="separator set-width">
            <h5>Inställningar för vald karta</h5>
          </div>
          <div className="tab-pane-bar">
            <ColorButtonBlue
              variant="contained"
              className="btn"
              onClick={(e) => this.toggleLayerMenu()}
              startIcon={<LayersIcon />}
            >
              Lagermeny
            </ColorButtonBlue>
            &nbsp;
            <ColorButtonBlue
              variant="contained"
              className="btn"
              onClick={(e) => this.toggleDrawOrderMenu()}
              startIcon={<SwapVertIcon />}
            >
              Ritordning
            </ColorButtonBlue>
            &nbsp;
            <ColorButtonBlue
              variant="contained"
              className="btn"
              onClick={(e) => this.toggleMapOptionsMenu()}
              startIcon={<SettingsIcon />}
            >
              Inställningar
            </ColorButtonBlue>
            &nbsp;
            <ColorButtonBlue
              variant="contained"
              className="btn"
              onClick={(e) => this.toggleToolMenu()}
              startIcon={<BuildIcon />}
            >
              Verktyg
            </ColorButtonBlue>
            &nbsp;
            <ColorButtonBlue
              variant="contained"
              className="btn"
              onClick={(e) => this.togglequickLayers()}
              startIcon={<StarIcon />}
            >
              Snabbåtkomst
            </ColorButtonBlue>
          </div>
          {this.renderArticleContent()}
        </div>
      </section>
    );
  }
}

export default Menu;
