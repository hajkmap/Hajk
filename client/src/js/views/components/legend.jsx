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

var LegendItem = require('components/legenditem');

/**
 * @class
 */
var LegendView = {
  /**
   * Render the legend item component.
   * @instance
   * @return {external:ReactElement}
   */
  render: function () {
    return (
      <div className="legend">
      {
        this.props.legends.map((legend, index) =>
          <LegendItem key={"legend_" + index} icon={legend.Url} text={legend.Description} />
        )
      }
      </div>
    );
  }
};

/**
 * LegendView module.<br>
 * Use <code>require('views/legend')</code> for instantiation.
 * @module LegendView-module
 * @returns {LegendView}
 */
module.exports = React.createClass(LegendView);