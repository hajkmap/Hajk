// Copyright (C) 2016 Göteborgs Stad
//
// Denna programvara är fri mjukvara: den är tillåten att distribuera och modifiera
// under villkoren för licensen CC-BY-NC-SA 4.0.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the CC-BY-NC-SA 4.0 licence.
//
// http://creativecommons.org/licenses/by-nc-sa/4.0/
//
// Det är fritt att dela och anpassa programvaran för valfritt syfte
// med förbehåll att följande villkor följs:
// * Copyright till upphovsmannen inte modifieras.
// * Programvaran används i icke-kommersiellt syfte.
// * Licenstypen inte modifieras.
//
// Den här programvaran är öppen i syfte att den skall vara till nytta för andra
// men UTAN NÅGRA GARANTIER; även utan underförstådd garanti för
// SÄLJBARHET eller LÄMPLIGHET FÖR ETT VISST SYFTE.
//
// https://github.com/hajkmap/Hajk

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
import LayersIcon from "@material-ui/icons/Layers";
import SwapVertIcon from "@material-ui/icons/SwapVert";
import SettingsIcon from "@material-ui/icons/Settings";
import BuildIcon from "@material-ui/icons/Build";
import { withStyles } from "@material-ui/core/styles";
import { red, green, blue } from "@material-ui/core/colors";

var defaultState = {
  alert: false,
  corfirm: false,
  alertMessage: "",
  content: "",
  maps: [],
  confirmAction: () => {},
  denyAction: () => {}
};

const ColorButtonRed = withStyles(theme => ({
  root: {
    color: theme.palette.getContrastText(red[500]),
    backgroundColor: red[500],
    "&:hover": {
      backgroundColor: red[700]
    }
  }
}))(Button);

const ColorButtonGreen = withStyles(theme => ({
  root: {
    color: theme.palette.getContrastText(green[700]),
    backgroundColor: green[500],
    "&:hover": {
      backgroundColor: green[700]
    }
  }
}))(Button);

const ColorButtonBlue = withStyles(theme => ({
  root: {
    color: theme.palette.getContrastText(blue[500]),
    backgroundColor: blue[500],
    "&:hover": {
      backgroundColor: blue[700]
    }
  }
}))(Button);

$.fn.editable = function(component) {
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
        top: "-1px"
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
      input4 = $(`<textarea id="${id7}" type="text" /><br /><br />`),
      expanded = $('<div class="expanded-at-start"></div>'),
      toggled = $('<div class="expanded-at-start"></div>'),
      visible = $('<div class=""></div>'),
      editPreset = $('<div class=""></div>'),
      elem = node.get(0) || {};

    ok.css(btnCSS).click(store);

    layerOk.css(btnCSS).click(saveLayer);

    layerOk2.css(btnCSS).click(saveLayer);

    abort.css(btnCSS).click(e => {
      node.html(prev);
      reset();
    });

    abort2.css(btnCSS).click(e => {
      node.html(prev);
      reset();
    });

    if (node.parent().attr("data-expanded") === "true") {
      checkbox.attr("checked", "checked");
    }
    if (node.parent().attr("data-toggled") === "true") {
      checkbox2.attr("checked", "checked");
    }
    if (node.parent().attr("data-visibleatstart") === "true") {
      checkbox3.attr("checked", "checked");
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

    remove.css({ color: "red", marginRight: "4px" }).click(e => {
      component.setState({
        alert: true,
        confirm: true,
        alertMessage:
          "Objektet kommer att tas bort från lagermenyn, om det är en grupp som innehåller lager kommer alla undergrupper och ingående lager att tas bort. Är detta ok?",
        confirmAction: () => {
          node.parent().remove();
        }
      });
    });

    // For Group Nodes we want to grab value from data-name attribute, where it's encoded properly.
    const inputValue = node.parent()[0].classList.contains("group-node")
      ? node.parent()[0].attributes.getNamedItem("data-name").value
      : node.html();

    input
      .val(inputValue)
      .keydown(e => {
        if (e.keyCode === 13) {
          store();
        }
      })
      .css({
        marginButtom: "4px",
        padding: "4px"
      });

    tools.css({
      marginLeft: "13px",
      marginTop: "7px"
    });

    tools.append(ok, abort, toggled, expanded);
    layerTools.append(visible, layerOk, abort);
    presetTools.append(editPreset, layerOk2, abort2);

    if (node.hasClass("group-name")) {
      node
        .html(input)
        .after(tools)
        .before(remove);
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

  var enableEdit = e => {
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

  var onClick = e => {
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
  /**
   *
   */
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
      backgroundSwitcherBlack: true,
      backgroundSwitcherWhite: true,
      enableOSM: false,
      showBreadcrumbs: false,
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
      description: "Välj innehåll att visa i kartan"
    };
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
        reset: true
      });

      this.load("layermenu", () => {
        this.setState({
          reset: false,
          active: this.props.model.get("layerMenuConfig").active,
          visibleAtStart: this.props.model.get("layerMenuConfig")
            .visibleAtStart,
          backgroundSwitcherBlack: this.props.model.get("layerMenuConfig")
            .backgroundSwitcherBlack,
          backgroundSwitcherWhite: this.props.model.get("layerMenuConfig")
            .backgroundSwitcherWhite,
          enableOSM: this.props.model.get("layerMenuConfig").enableOSM || false,
          showBreadcrumbs: this.props.model.get("layerMenuConfig")
            .showBreadcrumbs,
          instruction: this.props.model.get("layerMenuConfig").instruction,
          dropdownThemeMaps: this.props.model.get("layerMenuConfig")
            .dropdownThemeMaps,
          themeMapHeaderCaption: this.props.model.get("layerMenuConfig")
            .themeMapHeaderCaption,
          visibleForGroups: this.props.model.get("layerMenuConfig")
            .visibleForGroups
            ? this.props.model.get("layerMenuConfig").visibleForGroups
            : [],
          target: this.props.model.get("layerMenuConfig").target || "toolbar",
          position: this.props.model.get("layerMenuConfig").position || "left",
          width: this.props.model.get("layerMenuConfig").width || "",
          height: this.props.model.get("layerMenuConfig").height || "",
          title: this.props.model.get("layerMenuConfig").title || "",
          description: this.props.model.get("layerMenuConfig").description || ""
        });
        $(".tree-view li").editable(this);
        $(".tree-view > ul").sortable();
      });
    });

    this.props.model.on("change:layers", () => {
      this.setState({
        layers: this.props.model.get("layers")
      });
    });

    this.props.model.on("change:layerMenuConfig", () => {
      this.setState({
        layerMenuConfig: this.props.model.get("layerMenuConfig")
      });

      setTimeout(() => {
        this.setState({
          layers: this.props.model.get("layers")
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
  componentWillMount() {}

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
        this.props.model.getAuthSetting(auth => {
          this.setState({ authActive: auth });
        });
        break;
      case "maps":
        this.props.model.loadMaps(maps => {
          this.setState({
            maps: maps
          });
          if (callback) callback();
        });
        break;
      case "layers":
        this.props.model.getConfig(
          this.props.model.get("config").url_layers,
          data => {
            var layers = [];
            data.wmslayers.forEach(l => {
              l.type = "WMS";
            });
            data.wmtslayers.forEach(l => {
              l.type = "WMTS";
            });
            data.arcgislayers.forEach(l => {
              l.type = "ArcGIS";
            });
            data.vectorlayers.forEach(l => {
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
          data => {
            this.props.model.set("projectionConfig", data.projection);
            this.props.model.set("toolConfig", data.tools);
            this.props.model.set("mapConfig", data.map);
            this.props.model.set(
              "layerMenuConfig",
              data.tools.find(tool => tool.type === "layerswitcher").options
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
      filter: e.target.value
    });
  }

  /**
   *
   */
  getLayersWithFilter(filter) {
    return this.props.model.get("layers").filter(layer => {
      return new RegExp(this.state.filter).test(layer.caption.toLowerCase());
    });
  }

  /**
   *
   */
  getLayerNameFromId(id) {
    var layer = this.props.model.get("layers").find(layer => layer.id === id);
    return layer ? layer.caption : `---[layer id ${id} not found]---`;
  }

  /**
   *
   */
  parseSettings() {
    var settings = {
      groups: [],
      baselayers: [],
      active: this.state.active,
      visibleAtStart: this.state.visibleAtStart,
      backgroundSwitcherBlack: this.state.backgroundSwitcherBlack,
      backgroundSwitcherWhite: this.state.backgroundSwitcherWhite,
      enableOSM: this.state.enableOSM,
      showBreadcrumbs: this.state.showBreadcrumbs,
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
      description: this.state.description
    };

    var roots = $(".tree-view > ul > li");
    let that = this;
    function layers(node) {
      return $(node)
        .find("> ul > li.layer-node")
        .toArray()
        .map(node => {
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
              drawOrder: node.dataset.draworder ? node.dataset.draworder : 1000,
              visibleAtStart: node.dataset.visibleatstart,
              visibleForGroups: visibleForGroups || [],
              infobox: infobox || ""
            };
          } else {
            return {
              id: node.dataset.id,
              drawOrder: node.dataset.draworder ? node.dataset.draworder : 1000,
              visibleAtStart: node.dataset.visibleatstart,
              infobox: infobox || ""
            };
          }
        });
    }

    function groups(node) {
      var groups = [];
      $(node)
        .find("> ul > li.group-node")
        .toArray()
        .forEach(node => {
          groups.push(groupItem(node));
        });
      return groups;
    }

    function groupItem(node) {
      function getParent(node) {
        var parent = $(node)
          .parents(".group-node")
          .first();
        if (parent.length === 1) {
          return parent[0].dataset.id;
        }
        return "-1";
      }
      return {
        id: node.dataset.id,
        type: node.dataset.type,
        name: node.dataset.name,
        toggled: node.dataset.toggled,
        expanded: node.dataset.expanded,
        parent: getParent(node),
        layers: layers(node),
        groups: groups(node)
      };
    }

    roots.toArray().forEach(root => {
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
              visibleAtStart: root.dataset.visibleatstart,
              drawOrder: 0,
              visibleForGroups: visibleForGroups || [],
              infobox: ""
            })
          : settings.groups.push(groupItem(root));
      } else {
        root.dataset.type === "layer"
          ? settings.baselayers.push({
              id: root.dataset.id,
              visibleAtStart: root.dataset.visibleatstart,
              drawOrder: 0,
              infobox: ""
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
        id: $(layer)
          .data("id")
          .toString()
      });
      j--;
    });
    return result;
  }

  /**
   *
   */
  save(settings) {
    this.props.model.updateConfig(settings, success => {
      if (success) {
        this.setState({
          reset: true
        });

        this.props.model.set({ layerMenuConfig: settings });

        this.setState({
          reset: false
        });

        $(".tree-view li").editable(this);
        $(".tree-view > ul").sortable();

        this.setState({
          content: "mapsettings",
          alert: true,
          alertMessage: "Uppdateringen lyckades."
        });
      } else {
        this.setState({
          alert: true,
          alertMessage: "Uppdateringen misslyckades."
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

    settings.forEach(setting => {
      var layer = this.props.model.findLayerInConfig(setting.id);
      if (layer) {
        layer.drawOrder = setting.drawOrder;
      }
    });

    var config = this.props.model.get("layerMenuConfig");

    this.props.model.updateConfig(config, success => {
      if (success) {
        this.setState({
          content: "mapsettings",
          alert: true,
          alertMessage: "Uppdateringen lyckades."
        });
        this.forceUpdate();
      } else {
        this.setState({
          alert: true,
          alertMessage: "Uppdateringen misslyckades."
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
    var layerName = this.getLayerNameFromId(id);

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
        confirmAction: () => {}
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
      layers.forEach(layer => {
        layer.caption.toLowerCase().indexOf(this.state.filter) === 0
          ? startsWith.push(layer)
          : alphabetically.push(layer);
      });

      startsWith.sort(function(a, b) {
        if (a.caption.toLowerCase() < b.caption.toLowerCase()) return -1;
        if (a.caption.toLowerCase() > b.caption.toLowerCase()) return 1;
        return 0;
      });

      alphabetically.sort(function(a, b) {
        if (a.caption.toLowerCase() < b.caption.toLowerCase()) return -1;
        if (a.caption.toLowerCase() > b.caption.toLowerCase()) return 1;
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
            {layer.caption} {displayType}
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
                  {that.getLayerNameFromId(
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
                  {that.getLayerNameFromId(
                    typeof layer === "object" ? layer.id : layer
                  )}
                </span>
              </li>
            );
          }
        });
        if (group.hasOwnProperty("groups")) {
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
      toolOptions: false
    });

    setTimeout(() => {
      $(".tree-view > ul").sortable();
      this.setState({
        drawOrder: true
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
      toolOptions: false
    });

    setTimeout(() => {
      this.update();
      this.setState({
        layerMenu: true
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
      toolOptions: false
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
      toolOptions: true
    });
  }

  setSelectedConfig(e) {
    var url = this.props.model.get("config").url_map + "/" + e.target.value;
    this.props.model.set({
      urlMapConfig: url,
      mapFile: e.target.value
    });
  }

  /**
   *
   */
  renderDrawOrder() {
    function flatten(config) {
      var layerList = [];
      function fromGroups(groups) {
        return groups.reduce((list, n, index, array) => {
          var g = array[index];
          if (g.hasOwnProperty("groups")) {
            list = list.concat(fromGroups(g.groups));
          }
          return list.concat(g.layers);
        }, []);
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
      var name = this.getLayerNameFromId(layer.id);
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

  handleInputChange = event => {
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
      [name]: value
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
      visibleForGroups: value !== "" ? groups : []
    });
  }

  /**
   * Visar / döljer lista över tillgängliga AD-grupper
   */
  toggleHidden() {
    if (this.state.authActive) {
      this.setState({
        isHidden: !this.state.isHidden
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
      this.props.model.fetchADGroups(grps => {
        this.setState({ adGroups: grps });

        this.setState({
          adList: (
            <ListProperties
              properties={this.state.adGroups}
              show={this.state.isHidden}
            />
          )
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
            onChange={e => {
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
            onChange={e => {
              this.setState({ themeMapHeaderCaption: e.target.value });
            }}
          />
        </div>
      </div>
    );
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
                onClick={e => this.saveDrawOrder(e)}
                startIcon={<SaveIcon />}
              >
                Spara
              </ColorButtonBlue>
              &nbsp;
              <ul>{this.renderDrawOrder()}</ul>
              <ColorButtonBlue
                variant="contained"
                className="btn"
                onClick={e => this.saveDrawOrder(e)}
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
              onChange={e => this.filterLayers(e)}
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
                onClick={e => this.saveSettings(e)}
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
                    onChange={e => {
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
                    onChange={e => {
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
                      title="Höjd i pixlar på verktygets fönster. Anges som ett numeriskt värde. Lämna tomt för att använda maximal höjd."
                    />
                  </label>
                  <input
                    id="height"
                    name="height"
                    type="number"
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
              <div className="separator">Inställningar för plugins</div>
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
                  id="showBreadcrumbs"
                  name="showBreadcrumbs"
                  type="checkbox"
                  onChange={this.handleInputChange}
                  checked={this.state.showBreadcrumbs}
                />
                &nbsp;
                <label className="long-label" htmlFor="showBreadcrumbs">
                  Visa "brödsmulor"{" "}
                  <i
                    className="fa fa-question-circle"
                    data-toggle="tooltip"
                    title="När rutan är ikryssad visas små kort längst ned på skärmen, ett för varje lager som är aktivt"
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
                  onClick={e => this.saveSettings(e)}
                  startIcon={<SaveIcon />}
                >
                  Spara
                </ColorButtonBlue>
                &nbsp;
                <ColorButtonGreen
                  variant="contained"
                  className="btn"
                  onClick={e => this.createGroup("Ny grupp", false, false)}
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
                  onClick={e => this.saveSettings(e)}
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
          alertMessage: ""
        });
      },
      denyAction: () => {
        this.state.denyAction();
        this.setState({
          alert: false,
          confirm: false,
          alertMessage: ""
        });
      },
      onClick: () => {
        this.setState({
          alert: false,
          alertMessage: ""
        });
      }
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
        this.props.model.deleteMap(err => {
          var msg = err || "Kartan raderades";
          this.setState({
            content: "mapsettings",
            alert: true,
            alertMessage: msg
          });
          this.load("maps");
        });
      }
    });
  }

  createMap() {
    var name = this.refs.mapName.value;
    if (!/[^0-9a-zA-Z_]/.test(name) && name.trim().length > 0) {
      this.props.model.createMap(name, () => {
        this.setState({
          content: "mapsettings",
          alert: true,
          alertMessage: "En ny karta skapades utan problem."
        });
        this.load("maps");
      });
    } else {
      this.setState({
        alert: true,
        alertMessage:
          "Felaktigt namn på kartan \nInga eller ogiltiga tecken har angivits. \n\nGiltiga tecken: 0-9 a-z A-Z _"
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
                onChange={e => {
                  this.setSelectedConfig(e);
                }}
                ref="map-chooser"
              >
                {options}
              </select>
              &nbsp;
              <ColorButtonRed
                variant="contained"
                className="btn"
                onClick={e => this.deleteMap()}
                startIcon={<DeleteIcon />}
              >
                Ta bort karta
              </ColorButtonRed>
            </div>

            <Divider orientation="vertical" flexItem />

            <div className="inset-form map-management-margin-left margined">
              <form
                onSubmit={e => {
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
              onClick={e => this.toggleLayerMenu()}
              startIcon={<LayersIcon />}
            >
              Lagermeny
            </ColorButtonBlue>
            &nbsp;
            <ColorButtonBlue
              variant="contained"
              className="btn"
              onClick={e => this.toggleDrawOrderMenu()}
              startIcon={<SwapVertIcon />}
            >
              Ritordning
            </ColorButtonBlue>
            &nbsp;
            <ColorButtonBlue
              variant="contained"
              className="btn"
              onClick={e => this.toggleMapOptionsMenu()}
              startIcon={<SettingsIcon />}
            >
              Inställningar
            </ColorButtonBlue>
            &nbsp;
            <ColorButtonBlue
              variant="contained"
              className="btn"
              onClick={e => this.toggleToolMenu()}
              startIcon={<BuildIcon />}
            >
              Verktyg
            </ColorButtonBlue>
          </div>
          {this.renderArticleContent()}
        </div>
      </section>
    );
  }
}

export default Menu;
