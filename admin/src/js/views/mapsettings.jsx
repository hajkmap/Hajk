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
import $ from "jquery";
import Alert from "../views/alert.jsx";
import ListProperties from "../views/listproperties.jsx";

var defaultState = {
  alert: false,
  corfirm: false,
  alertMessage: "",
  content: "",
  maps: [],
  confirmAction: () => {},
  denyAction: () => {}
};

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
        node.parent().attr("data-infobox", input4.val());
      }

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
      input4 = $(`<textarea id="${id7}" />`),
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
      visible.append(label6, input4);
    }

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

    input
      .val(node.html())
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
    var state = {
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
      toggleAllButton: false,
      instruction: "",
      dropdownThemeMaps: false,
      themeMapHeaderCaption: "Temakartor",
      visibleForGroups: [],
      adList: null
    };
    this.state = state;
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
          toggleAllButton: this.props.model.get("layerMenuConfig")
            .toggleAllButton,
          instruction: this.props.model.get("layerMenuConfig").instruction,
          dropdownThemeMaps: this.props.model.get("layerMenuConfig")
            .dropdownThemeMaps,
          themeMapHeaderCaption: this.props.model.get("layerMenuConfig")
            .themeMapHeaderCaption,
          visibleForGroups: this.props.model.get("layerMenuConfig")
            .visibleForGroups
            ? this.props.model.get("layerMenuConfig").visibleForGroups
            : []
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
            data.extendedwmslayers.forEach(l => {
              l.type = "ExtendedWMS";
            });
            layers = data.wmslayers
              .concat(data.wmtslayers)
              .concat(data.arcgislayers)
              .concat(data.vectorlayers)
              .concat(data.extendedwmslayers);
            layers.sort((a, b) => {
              var d1 = parseInt(a.date),
                d2 = parseInt(b.date);
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
    return layer ? layer.caption : "";
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
      toggleAllButton: this.state.toggleAllButton,
      instruction: this.state.instruction,
      dropdownThemeMaps: this.state.dropdownThemeMaps,
      themeMapHeaderCaption: this.state.themeMapHeaderCaption,
      visibleForGroups: this.state.visibleForGroups.map(
        Function.prototype.call,
        String.prototype.trim
      )
    };

    var roots = $(".tree-view > ul > li");
    let that = this;
    function layers(node) {
      return $(node)
        .find("> ul > li.layer-node")
        .toArray()
        .map(node => {

          const formattedNode = {
            id: node.dataset.id,
            drawOrder: node.dataset.draworder ? parseInt(node.dataset.draworder) : 1000, //parse integet
            visibleAtStart: node.dataset.visibleatstart === 'true', //parse boolean
          }

          if (that.state.authActive) {
            let visibleForGroups = node.dataset.visibleforgroups
              ? node.dataset.visibleforgroups.split(",")
              : [];
            let infobox = node.dataset.infobox ? node.dataset.infobox : "";
            if (Array.isArray(visibleForGroups)) {
              visibleForGroups = visibleForGroups.map(
                Function.prototype.call,
                String.prototype.trim
              );
            } else {
              visibleForGroups = String.prototype.trim(visibleForGroups);
            }

            formattedNode.visibleForGroups = visibleForGroups || [];
            formattedNode.infobox = infobox || "";

            return formattedNode;
          } else {
            return formattedNode;
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
              drawOrder: 0
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
        layer.caption.toLowerCase().indexOf(this.state.filter) == 0
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

    // Sort layers alphabetically
    layers.sort((a, b) => {
      return a.caption.toLowerCase().localeCompare(b.caption.toLowerCase());
    });

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
        case "ExtendedWMS":
          displayType = "(Extended WMS)";
          break;
      }

      return (
        <li
          className="layer-item"
          onClick={() => this.addLayerToMenu(layer.id, layer, included)}
          key={i}
        >
          <span className={cls} />&nbsp;
          <span>
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
          if (that.state.authActive) {
            let visibleForGroups = layer.visibleForGroups
              ? layer.visibleForGroups
              : [];
            let infobox = layer.infobox ? layer.infobox : "";

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

    layers.sort(
      (a, b) =>
        a.drawOrder === b.drawOrder 
          ? 0 
          : (a.drawOrder < b.drawOrder ? -1 : 1)
    );

    return layers.reverse().map((layer, i) => {
      var name = this.getLayerNameFromId(layer.id);
      return (
        <li
          className="layer-node"
          key={layer.id}
          data-id={layer.id}
        >
          {name}
        </li>
      );
    });
  }

  handleInputChange(event) {
    const target = event.target;
    const name = target.name;
    var value = target.type === "checkbox" ? target.checked : target.value;

    if (typeof value === "string" && /^[\d\.\, ]+$/.test(value)) {
      value = value
        .replace(/,/g, "")
        .replace(/ /g, "")
        .Number(value);
    }

    if (name == "instruction") {
      value = btoa(value);
    }

    this.setState({
      [name]: value
    });
  }

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
    if (this.state.authActive) {
      return (
        <div className="row">
          <div className="col-sm-1">
            <input
              id="dropdownThemeMaps"
              name="dropdownThemeMaps"
              type="checkbox"
              onChange={e => {
                this.handleInputChange(e);
              }}
              checked={this.state.dropdownThemeMaps}
            />&nbsp;
          </div>
          <label
            className="layer-menu-label-checkbox"
            htmlFor="dropdownThemeMaps"
          >
            Visa lista över temakartor
          </label>
        </div>
      );
    } else {
      return null;
    }
  }

  /**
   * Renderar inmatningsfält för rubriksättning till temakartor
   */
  renderThemeMapHeaderInput() {
    if (this.state.authActive) {
      return (
        <div className="row">
          <div className="col-sm-12">
            <label htmlFor="themeMapHeaderCaption">Rubriktext temakartor</label>
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
    } else {
      return null;
    }
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
              <button
                className="btn btn-primary"
                onClick={e => this.saveDrawOrder(e)}
              >
                Spara
              </button>&nbsp;
              <ul>{this.renderDrawOrder()}</ul>
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
              <button
                className="btn btn-primary"
                onClick={e => this.saveSettings(e)}
              >
                Spara
              </button>&nbsp;
              <button
                className="btn btn-success"
                onClick={e => this.createGroup("Ny grupp", false, false)}
              >
                Ny grupp
              </button>&nbsp;
              <div className="row">
                <div className="col-sm-1">
                  <input
                    id="active"
                    name="active"
                    type="checkbox"
                    onChange={e => {
                      this.handleInputChange(e);
                    }}
                    checked={this.state.active}
                  />&nbsp;
                </div>
                <label className="layer-menu-label-checkbox" htmlFor="active">
                  Aktiverad
                </label>
              </div>
              <div className="row">
                <div className="col-sm-1">
                  <input
                    id="visibleAtStart"
                    name="visibleAtStart"
                    type="checkbox"
                    onChange={e => {
                      this.handleInputChange(e);
                    }}
                    checked={this.state.visibleAtStart}
                  />&nbsp;
                </div>
                <label
                  className="layer-menu-label-checkbox"
                  htmlFor="visibleAtStart"
                >
                  Synlig vid start
                </label>
              </div>
              <div className="row">
                <div className="col-sm-1">
                  <input
                    id="backgroundSwitcherBlack"
                    name="backgroundSwitcherBlack"
                    type="checkbox"
                    onChange={e => {
                      this.handleInputChange(e);
                    }}
                    checked={this.state.backgroundSwitcherBlack}
                  />&nbsp;
                </div>
                <label
                  className="layer-menu-label-checkbox"
                  htmlFor="backgroundSwitcherBlack"
                >
                  Svart bakgrundskarta
                </label>
              </div>
              <div className="row">
                <div className="col-sm-1">
                  <input
                    id="backgroundSwitcherWhite"
                    name="backgroundSwitcherWhite"
                    type="checkbox"
                    onChange={e => {
                      this.handleInputChange(e);
                    }}
                    checked={this.state.backgroundSwitcherWhite}
                  />&nbsp;
                </div>
                <label htmlFor="backgroundSwitcherWhite">
                  Vit bakgrundskarta
                </label>
              </div>
              <div className="row">
                <div className="col-sm-1">
                  <input
                    id="toggleAllButton"
                    name="toggleAllButton"
                    type="checkbox"
                    onChange={e => {
                      this.handleInputChange(e);
                    }}
                    checked={this.state.toggleAllButton}
                  />&nbsp;
                </div>
                <label
                  className="layer-menu-label-checkbox"
                  htmlFor="toggleAllButton"
                >
                  Släck alla lager-knapp
                </label>
              </div>
              {this.renderThemeMapCheckbox()}
              {this.renderThemeMapHeaderInput()}
              <div className="row">
                <div className="col-sm-12">
                  <label htmlFor="instruction">Instruktion</label>
                  <textarea
                    id="instruction"
                    name="instruction"
                    type="text"
                    onChange={e => {
                      this.handleInputChange(e);
                    }}
                    value={
                      this.state.instruction ? atob(this.state.instruction) : ""
                    }
                  />
                </div>
              </div>
              <div className="row">{this.renderAuthGrps()}</div>
              {this.renderLayerMenu()}
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
      alertMessage: "Vill du verkligen radera kartan?",
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
    this.props.model.createMap(name, () => {
      this.setState({
        content: "mapsettings",
        alert: true,
        alertMessage: "En ny karta skapades utan problem."
      });
      this.load("maps");
    });
  }

  /**
   *
   */
  render() {
    var options = this.state.maps.map((map, i) => (
      <option key={i}>{map}</option>
    ));

    return (
      <section className="tab-pane active">
        <Alert options={this.getAlertOptions()} />
        <div>
          <h1>Kartinställningar</h1>
          <div className="inset-form">
            <form
              onSubmit={e => {
                e.preventDefault();
                this.createMap(e);
              }}
            >
              <h3>Skapa karta</h3>
              <label>Namn</label>&nbsp;<input type="text" ref="mapName" />
              <br />
              <br />
              <button className="btn btn-primary">Skapa</button>
            </form>
          </div>
          <br />
          <div className="inset-form">
            <label>Välj karta</label>&nbsp;<select
              onChange={e => {
                this.setSelectedConfig(e);
              }}
              ref="map-chooser"
            >
              {options}
            </select>
          </div>
          <div className="tab-pane-bar">
            <button className="btn btn-danger" onClick={e => this.deleteMap()}>
              Ta bort karta
            </button>&nbsp;
            <button
              className="btn btn-info"
              onClick={e => this.toggleLayerMenu()}
            >
              Lagermeny
            </button>&nbsp;
            <button
              className="btn btn-info"
              onClick={e => this.toggleDrawOrderMenu()}
            >
              Ritordning
            </button>&nbsp;
            <button
              className="btn btn-info"
              onClick={e => this.toggleMapOptionsMenu()}
            >
              Inställningar
            </button>&nbsp;
            <button
              className="btn btn-info"
              onClick={e => this.toggleToolMenu()}
            >
              Verktyg
            </button>
          </div>
          {this.renderArticleContent()}
        </div>
      </section>
    );
  }
}

export default Menu;
