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
// https://github.com/Johkar/Hajk2

var Panel = require("views/panel");
/**
 * @class
 */
var PresetPanelView = {
  /**
   * Get initial state.
   * @instance
   * @return {object}
   */
  getInitialState: function() {
    return {
      anchor: ""
    };
  },

  /**
   * Delegate to handle insertion of presets.
   * @instance
   * @param {object} e - Syntetic DOM event.
   */
  onSubmitForm: function(e) {
    e.preventDefault();
    var name = ReactDOM.findDOMNode(this.refs.name).value;
    this.props.model.addPreset(name, () => this.forceUpdate());
  },

  /**
   * Triggered when component updates.
   * @instance
   */
  componentDidUpdate: function() {},

  /**
   * Triggered when the component is successfully mounted into the DOM.
   * @instance
   */
  componentDidMount: function() {
    this.generate();
  },

  /**
   * Generete anchor text.
   * @instance
   */
  generate: function() {
    this.setState({
      anchor: this.props.model.generate()
    });
  },

  /**
   * Render the view
   * @instance
   * @return {external:ReactElement}
   */
  render: function() {
    var anchor = this.props.model.get("anchor");
    var presetName = this.props.model.get("presetName");
    var presetUrl = this.props.model.get("presetUrl");

    var getUrl = this.props.model.getUrl();
    var presets = this.props.model.getPresets();
    var items = null;

    if (presets) {
      items = presets.map((preset, i) => {
        return (
          <a key={i} href={getUrl + preset.presetUrl}>
            <li>
              {preset.name} <i className="fa fa-bookmark preset-icon" />
            </li>
          </a>
        );
      });
    }

    return (
      <Panel
        title="Snabbval"
        onUnmountClicked={this.props.onUnmountClicked}
        onCloseClicked={this.props.onCloseClicked}
        instruction={atob(this.props.model.get("instruction"))}
      >
        <div className="bookmark-panel panel-content">
          <label>Tillgängliga snabbval</label>
          <ul>{items}</ul>
        </div>
      </Panel>
    );
  }
};

/**
 * PresetPanelView module.<br>
 * Use <code>require('views/presetpanel')</code> for instantiation.
 * @module PresetPanelView-module
 * @returns {PresetPanelView}
 */
module.exports = React.createClass(PresetPanelView);
