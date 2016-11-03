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

/**
 * @class
 */
var FeatureInfoView = {
  /**
   * Convert object to markdown
   * @instance
   * @param {object} object to transform
   * @return {string} markdown
   */
  objectAsMarkdown: function (o) {
    return Object
      .keys(o)
      .reduce((str, next, index, arr) =>
        /^geom$|^geometry$|^the_geom$/.test(arr[index]) ?
        str : str + `**${arr[index]}**: ${o[arr[index]]}\r`
      , "");
  },

  /**
   * Render the feature info component.
   * @instance
   * @return {external:ReactElement}
   */
  render: function name() {
    if (!this.props.info) {
      return false;
    }

    var html = ""
    ,   icon = ''
    ,   info = this.props.info.information
    ;

    if (typeof info === 'object') {
      info = this.objectAsMarkdown(this.props.info.information);
    }

    html = marked(info, { sanitize: false, gfm: true, breaks: true });

    if (this.props.info.iconUrl != '') {
      icon = <img src={this.props.info.iconUrl}></img>;
    }

    return (
      <div>
        <div className="header">{icon}<h1>{this.props.info.caption}</h1></div>
        <div className="information">
          <span dangerouslySetInnerHTML={{__html: html}} />
        </div>
      </div>
    );
  }
};

/**
 * BackgroundSwitcherView module.<br>
 * Use <code>require('views/backgroundswitcher')</code> for instantiation.
 * @module BackgroundSwitcherView-module
 * @returns {BackgroundSwitcherView}
 */
module.exports = React.createClass(FeatureInfoView);