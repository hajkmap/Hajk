// Copyright (C) 2016 Göteborgs Stad
//
// Detta program är fri mjukvara: den är tillåtet att redistribuera och modifeara
// under villkoren för licensen CC-BY-NC-ND 4.0.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the CC-BY-NC-ND 4.0 licence.
//
// http://creativecommons.org/licenses/by-nc-nd/4.0/
//
// Det är fritt att dela och anpassa programvaran för valfritt syfte
// med förbehåll att följande villkor följs:
// * Cypyright till upphovsmannen inte modifieras.
// * Programvaran används i icke-komersiellt syfte.
// * Licenstypen inte modifieras.
//
// Den här programvaran är öppen i syfte att den skall vara till nytta för andra
// men UTAN NÅGRA GARANTIER; även utan underförstådd garanti för
// SÄLJBARHET eller LÄMPLIGHET FÖR ETT VISST SYFTE.
//
// https://github.com/Johkar/Hajk2

class Map extends React.Component {

  constructor() {
    super();
  }

  load() {

    if (!HAJK2) return;

    HAJK2.wmsProxy = "";
    HAJK2.searchProxy = "/postProxy.aspx?url=";

    HAJK2.start({
      configPath: "/mapservice/settings/config/map_1",
      layersPath: "/mapservice/settings/config/layers"
    }, function (status, message) {
      if (!status) {
        document.write(message);
      }
    });

  }

  render() {
    return (
      <div>
        <div id="map" style={{ position: 'absolute', height: '600px', width: '100%'}}></div>
        <div> {this.load()} </div>
      </div>
    );
  }

}

module.exports = Map;