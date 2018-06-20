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

var panels = {
  'infopanel': require('views/infopanel'),
  'layerpanel': require('views/layerpanel'),
  'bookmarkpanel': require('views/bookmarkpanel'),
  'searchpanel': require('views/searchpanel'),
  'coordinatespanel': require('views/coordinatespanel'),
  'exportpanel': require('views/exportpanel'),
  'drawpanel': require('views/drawpanel'),
  'editpanel': require('views/editpanel'),
  'anchorpanel': require('views/anchorpanel'),
  'streetviewpanel': require('views/streetviewpanel'),
  'bufferpanel': require('views/bufferpanel'),
  'routingpanel': require('views/routingpanel'),
  'presetpanel': require('views/presetpanel'),
  'measurepanel': require('views/measurepanel'),
  'mailexportpanel': require('views/mailexportpanel')
};

var Alert = require('alert');

/**
 * @class
 */
var NavigationPanelView = {
  /**
   * Get default properties.
   * @instance
   * @return {object}
   */
  getDefaultProps: function () {
    return {
      items: [],
      alertVisible: false
    };
  },

  /**
   * Get initial state.
   * @instance
   * @return {object}
   */
  getInitialState: function () {
    return {
      toggled: false,
      minimized: false,
      activePanel: undefined
    };
  },

  forced: false,

  /**
   * Triggered when the component is successfully mounted into the DOM.
   * @instance
   */
  componentDidMount: function () {
    this.props.model.on('change:activePanel', (sender, panel) => {
      this.forced = true;
      this.setState({
        activePanel: panel,
        minimized: false
      });
      this.forced = false;
    });

    this.props.model.on('change:alert', (e, value) => {
      this.setState({alertVisible: value});
    });

    this.props.model.on('change:visible', (sender, visible) => {
      this.setState({toggled: visible});
      if (visible) {
        this.forced = true;
      }
      setTimeout(() => {
        this.forced = false;
      }, 100);
    });

    this.props.model.on('change:toggled', (sender, visible) => {
      var minimized = true;
      if (this.forced) {
        minimized = false;
      }
      this.setState({minimized: minimized});
      this.forced = false;
    });

    this.props.model.on('change:r', () => {
      this.maximize();
    });
  },

  /**
   * Toggle the panel to/from minimized mode.
   * @instance
   */
  toggle: function () {
    if (this.state.activePanel) {
      this.props.model.set('toggled', !this.props.model.get('toggled'));
    }
  },

  /**
   * Maximize the panel.
   * @instance
   */
  maximize: function () {
    if (this.state.minimized) {
      this.setState({
        minimized: false
      });
    }
  },

  /**
   * Minimize the panel.
   * @instance
   */
  minimize: function () {
    if (!this.state.minimized) {
      this.setState({
        minimized: true
      });
    }
  },

  /**
   * Generate specification object for alert panel
   * @instance
   */
  getAlertOptions: function () {
    return {
      visible: this.state.alertVisible,
      confirm: true,
      message: 'Du har en aktiv redigeringssession startad, vill du avbryta?',
      denyAction: () => {
        this.props.model.set('alert', false);
        this.props.model.deny();
      },
      confirmAction: () => {
        this.props.model.set('alert', false);
        this.props.model.ok();
      }
    };
  },

  unmount: function () {
    var model = this.props.model.get('activePanel').model;
    model.set({'visible': false});
    this.props.model.set({'visible': false});
    this.props.model.set({'activePanelType': undefined});
    this.props.model.set({'activePanel': undefined});
  },

  /**
   * Render the panel component.
   * @instance
   * @return {external:ReactElement}
   */
  render: function () {
    var classes = this.state.toggled ? 'navigation-panel' : 'navigation-panel folded',
      panelInstance = null,
      Panel = null;

    if (this.state.minimized) {
      classes += ' minimized';
    }

    if (this.state.activePanel) {
      if (panels.hasOwnProperty(this.state.activePanel.type.toLowerCase())) {
        Panel = panels[this.state.activePanel.type.toLowerCase()];
        panelInstance = (
          <Panel
            model={this.state.activePanel.model}
            minimized={this.state.minimized}
            navigationPanel={this}
            onCloseClicked={() => { this.toggle(); }}
            onUnmountClicked={() => { this.unmount(); }}
          />
        );
      } else {
        console.error('Panel reference is not found. See Navigationpanel.jsx.');
      }
    }

    return (
      <div>
        <Alert options={this.getAlertOptions()} />
        <div id='navigation-panel' className={classes} onClick={this.maximize}>
          {panelInstance}
        </div>
      </div>
    );
  }
};

/**
 * NavigationPanelView module.<br>
 * Use <code>require('views/navigationpanel')</code> for instantiation.
 * @module NavigationPanelView-module
 * @returns {NavigationPanelView}
 */
module.exports = React.createClass(NavigationPanelView);
