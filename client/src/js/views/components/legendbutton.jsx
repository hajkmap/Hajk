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

var LegendButton = React.createClass({
  render: function () {
    var title = this.props.checked ? "Dölj teckenförklaring" : "Visa teckenförklaring";
    var className = this.props.checked ? "fa fa-angle-down" : "fa fa-list";
    var fontSize = this.props.checked ? "26px" : "16px";
    return (
       <span className="clickable pull-right" title={title} style={{ position: 'relative', top: '3px' }}>
          <i className={className} style={{ fontSize: fontSize }}></i>
       </span>
    );
  }
});

module.exports = LegendButton;