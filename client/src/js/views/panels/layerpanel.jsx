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

var Panel = require('views/panel');
var LayerItem = require('views/layeritem');
var BackgroundSwitcher = require('components/backgroundswitcher');

/**
 * @class
 */
var LayerPanelView = {
  /**
   * Mounted layers
   * @property {object}
   * @instance
   */
  mountedLayers: {},
  renderedLayerGroups: {},

  /**
   * Get initial state.
   * @instance
   * @return {object}
   */
  getInitialState: function () {
    this.renderedLayerGroups = {};
    return {
      visible: false,
      mapConfigurations: [],
      dropDownValue: HAJK2.configFile
    };
  },

  componentWillMount: function () {
    this.props.model.setExpanded(this.props.model.get('groups'));
  },

  /**
   * Triggered when the component is successfully mounted into the DOM.
   * @instance
   */
  componentDidMount: function () {
    if (this.props.model.get('dropdownThemeMaps')) {
      this.populateThemeMaps();
    }

    this.props.model.on('change:layerCollection', this.onLayerCollectionChanged, this);
    this.props.model.get('layerCollection').forEach(layer => {
      layer.on('change:visible', () => {
        this.updateGroupToggledCheckbox(layer);
      });
    });
    this.setState({
      layers: this.props.model.get('layerCollection')
    });
  },

  /**
   * Triggered when component unmounts.
   * @instance
   */
  componentWillUnmount: function () {
    this.props.model.off('change:layerCollection', this.onLayerCollectionChanged, this);
    this.props.model.get('layerCollection').forEach(layer => {
      layer.off('change:visible');
    });
  },

  /**
   * On layer collection change event handler.
   * @instance
   */
  onLayerCollectionChanged: function () {
    this.setState({ layers: this.props.model.get('layerCollection') });
  },

  /**
   * Find group in config tree.
   * @instance
   * @param {object[]} groups
   * @param {number} groupId
   * @return {object} group
   */
  findGroupInConfig: function recursive (groups, id) {
    var found = false;
    groups.forEach(group => {
      if (group.id === id) {
        found = group;
      } else {
        if (group.hasOwnProperty('groups')) {
          if (!found) {
            found = recursive(group.groups, id);
          }
        }
      }
    });
    return found;
  },

  /**
   * Find layers in given group.
   * @instance
   * @param {group} group
   * @return {Layer[]} layers
   */
  getLayersForGroup: function (group) {
    var layersInModel = this.props.model.get('layerCollection'),
      layers = [];

    if (!layersInModel || !group) {
      return [];
    }

    group.layers.forEach(inLayer => {
      var layer = layersInModel.find(layer => layer.id === inLayer.id);
      if (layer) {
        layer.set('group', group.id);
        layers.push(layer);
      }
    });

    return layers;
  },

  /**
   * Get a flattened list of ALL layers per group.
   * @instance
   * @param {object} group
   * @return {Layer[]} layers
   */
  drillGroupForLayers: function recursive (group) {
    var groups = group.groups,
      layers = this.getLayersForGroup(group);

    if (groups) {
      groups.forEach((subgroup) => {
        layers = layers.concat(recursive.call(this, subgroup));
      });
    }

    return layers;
  },

  /**
   * Toggle the whole group
   * @deprecated
   * @instance
   * @param {object} group
   * @param {object} e
   */
  toggleGroup: function (group, e) {
    var layers = this.drillGroupForLayers(group);
    if (group.autoChecked !== undefined && group.autoChecked !== group.checked) {
      group.checked = group.autoChecked;
    }
    group.checked = !group.checked;
    this.forceUpdate();
    layers.forEach((layer) => {
      var groupId = layer.get('group');
      layer.set('visible', group.checked);
    });
  },

  /**
   * Update the group checkbox, checked if all the layers are visible.
   * @deprecated
   * @instance
   * @param {object} group
   * @param {object} e
   */
  updateGroupToggledCheckbox: function recur (layer) {
    if (!layer) return;

    var groupId = typeof layer === 'string' ? layer : (layer.get ? layer.get('group') : undefined),
      group,
      layers;

    if (groupId) {
      group = this.findGroupInConfig(this.groups, groupId);
      layers = this.drillGroupForLayers(group);

      if (group.parent && group.parent != -1) {
        recur.call(this, group.parent);
      }

      let checked = layers.every(layer => layer.getVisible() === true),
        $ref = $(this.refs['group_' + group.id]),
        checkedClass = 'fa-check-square-o',
        uncheckedClass = 'fa-square-o',
        activeGroup = layers.some(layer => layer.getVisible() === true),
        $refGroup = $(this.refs[group.id]),
        activeClass = 'active-group';

      if (checked) {
        $ref.removeClass(uncheckedClass);
        $ref.addClass(checkedClass);
        group.autoChecked = true;
      } else {
        $ref.removeClass(checkedClass);
        $ref.addClass(uncheckedClass);
        group.autoChecked = false;
      }

      if (activeGroup) {
        $refGroup.addClass('active-group');
      } else {
        $refGroup.removeClass('active-group');
      }
    }
  },

  /**
   * Toggle the visibility of all layers in given group.
   * @instance
   * @param {object} group
   * @param {object} e
   */
  toggleGroupVisibility: function (group, e) {
    var state = {},
      value,
      id = 'group_' + group.id;

    value = state[id] = this.state[id] === 'hidden' ? 'visible' : 'hidden';
    this.props.model.set(id, value);
    this.setState(state);
  },

  /**
   * Render layers in group.
   * @instance
   * @param {object} group
   * @return {LayerItemView[]}
   */
  renderLayers: function (group) {
    var layers = this.getLayersForGroup(group);

    if (layers.length === 0) {
      return null;
    }

    return layers.map((layer, index) => {
      return (<LayerItem key={'layer_' + Math.random()} layer={layer} />);
    });
  },

  /**
   * Render groups.
   * @instance
   * @param {object[]} groups
   * @return {external.ReactElement} groups
   */
  renderGroups: function recursive (groups) {
    return groups.map((group, i) => {
      if (!this.renderedLayerGroups.hasOwnProperty(group.id)) {
        this.renderedLayerGroups[group.id] = this.renderLayers(group);
      }

      var layers = this.renderedLayerGroups[group.id],
        subgroups,
        id = 'group_' + group.id,
        toggleGroup,
        buttonClassName,
        toggleClassName;

      if (layers) {
        layers.forEach(layer => {
          var id = layer.props.layer.get('id');
          if (!this.mountedLayers.hasOwnProperty(id)) {
            this.mountedLayers[id] = layer.props.layer;
          }
        });
      }

      if (!this.state.hasOwnProperty(id)) {
        this.state[id] = this.props.model.get(id);
      }

      if (group.hasOwnProperty('groups')) {
        subgroups = recursive.call(this, group.groups);
      }

      buttonClassName = this.state[id] === 'hidden'
        ? 'fa fa-angle-right clickable arrow'
        : 'fa fa-angle-up clickable arrow';

      toggleClassName = group.checked ? 'fa fa-check-square-o' : 'fa fa-square-o';

      toggleGroup = group.toggled
        ? (<i
          className={toggleClassName}
          style={{cursor: 'pointer', marginLeft: '4px', width: '14px'}}
          ref={id}
          onClick={this.toggleGroup.bind(this, group)}
          id={id}
        />)
        : null;

      return (
        <div className='layer-group' key={i}>
          <div>
            <span className={buttonClassName} onClick={this.toggleGroupVisibility.bind(this, group)} />
            {toggleGroup}
            <label style={{cursor: 'pointer', 'marginLeft': '4px'}} ref={group.id} onClick={this.toggleGroupVisibility.bind(this, group)} id={group.id}>{group.name}</label>
          </div>
          <div className={this.state[id]}>
            {layers}
            {subgroups}
          </div>
        </div>
      );
    });
  },

  /**
   * Toggle all layers
   * @instance
   */
  toggleAllOff () {
    this.props.model.toggleAllOff();
  },

  /**
   * Loads new config into HAJK2
   * @instance
   * @param {event} e
   */

  setThemeMap: function (e) {
    var configurationName = e.target.value;
    var index = e.nativeEvent.target.selectedIndex;
    var configurationTitle = e.nativeEvent.target[index].text;
    this.props.model.setThemeMap(configurationName, configurationTitle);
  },

  populateThemeMaps: function () {
    this.props.model.loadThemeMaps(mapConfigurations => {
      this.setState({
        mapConfigurations: mapConfigurations,
        dropDownValue: HAJK2.configFile
      });
    });
  },

  /**
   * Change layer-list configuration.
   * @deprecated
   * @instance
   * @param {object} e
   */
  selectTheme: function (e) {
    var value = e.target.value,
      before = this.mountedLayers;

    this.mountedLayers = {};
    this.props.model.set('selectedTheme', parseInt(value));
    this.setState({
      selectedTheme: value
    });

    // Set visible layers to false,
    // if they are missing on the new collection.
    // The set timeout is to force React to
    // set the new state before this is done.
    setTimeout(() => {
      var p = this.mountedLayers,
        a = Object.keys(before),
        b = Object.keys(p),
        m = a.filter(e => b.indexOf(e) < 0),
        l = this.state.layers;

      l.toArray().filter(layer =>
        m.find(v =>
          parseInt(v) === layer.get('id')
        )
      ).forEach(layer => {
        layer.setVisible(false);
      });
    }, 0);
  },

  openInstruction: function () {
    var element = $('#instructionText');
    element.toggle();
  },
  /**
   * Render themes select options.
   * @deprecated
   * @instance
   * @param {object[]} themes
   * @return {external.ReactElement} theme options
   */
  renderThemeOptions: function (themes) {
    return themes.map((theme, i) => (
      <option key={i} value={theme.id}>{theme.name}</option>
    ));
  },

  /**
   * Render the panel component.
   * @instance
   * @return {external:ReactElement}
   */
  render: function () {
    var mapConfigurations = [];
    if (typeof this.state.mapConfigurations !== 'undefined' && this.state.mapConfigurations != null) {
      mapConfigurations = this.state.mapConfigurations.map((map, i) => <option value={map.mapConfigurationName} key={i}>{map.mapConfigurationTitle}</option>);
    }
    var groups, toggleAllButton, dropdownThemeMaps, themeMapHeaderCaption;

    this.groups = this.props.model.get('groups');

    groups = this.renderGroups(this.props.model.get('groups'));

    this.props.model.get('layerCollection').forEach(layer => {
      this.updateGroupToggledCheckbox(layer);
    });

    if (this.props.model.get('toggleAllButton')) {
      toggleAllButton = (
        <div style={{marginBottom: '10px'}}>
          <button className='btn btn-main btn-inverse' onClick={() => this.toggleAllOff()}>Släck alla lager</button>
        </div>
      );
    }

    if (this.props.model.get('themeMapHeaderCaption') !== null &&
        this.props.model.get('themeMapHeaderCaption').length > 0) {
      themeMapHeaderCaption = (
        <span style={{marginRight: '10px'}}>{this.props.model.get('themeMapHeaderCaption')}</span>
      );
    }

    if (this.props.model.get('dropdownThemeMaps')) {
      dropdownThemeMaps = (
        <div>
          {themeMapHeaderCaption}
          <select onChange={this.setThemeMap} style={{marginBottom: '10px', width: '100%'}} value={this.state.dropDownValue}>
            {mapConfigurations}
          </select>
        </div>
      );
    }

    return (
      <Panel title='Kartlager' onCloseClicked={this.props.onCloseClicked} onUnmountClicked={this.props.onUnmountClicked} minimized={this.props.minimized} instruction={atob(this.props.model.get('instruction'))}>
        <div className='layer-panel'>
          {dropdownThemeMaps}
          {toggleAllButton}
          <BackgroundSwitcher layers={this.props.model.getBaseLayers()} model={this.props.model} />
          <br />
          {groups}
        </div>
      </Panel>
    );
  }
};

/**
 * LayerPanelView module.<br>
 * Use <code>require('views/layerpanel')</code> for instantiation.
 * @module LayerPanelView-module
 * @returns {LayerPanelView}
 */
module.exports = React.createClass(LayerPanelView);
