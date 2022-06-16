import React from "react";
import { Component } from "react";
import Anchor from "./tools/anchor.jsx";
import Buffer from "./tools/buffer.jsx";
import Bookmarks from "./tools/bookmarks.jsx";
import Coordinates from "./tools/coordinates.jsx";
import Draw from "./tools/draw.jsx";
import LayerComparer from "./tools/layercomparer.jsx";
import Sketch from "./tools/sketch.jsx";
import Edit from "./tools/edit.jsx";
import Export from "./tools/export.jsx";
import FmeServer from "./tools/fmeServer.jsx";
import Print from "./tools/print.jsx";
import Infoclick from "./tools/infoclick.jsx";
import Information from "./tools/information.jsx";
import Informative from "./tools/informative.jsx";
import Location from "./tools/location.jsx";
import Search from "./tools/search.jsx";
import StreetView from "./tools/streetview.jsx";
import Preset from "./tools/preset.jsx";
import Measure from "./tools/measure.jsx";
import Routing from "./tools/routing.jsx";
import Collector from "./tools/collector.jsx";
import Dummy from "./tools/dummy.jsx";
import MenuEditor from "./tools/MenuEditor/menuEditor.jsx";
import TimeSlider from "./tools/timeslider.jsx";
import GeosuiteExport from "./tools/geosuiteExport.jsx";
import VisionIntegration from "./tools/visionIntegration.jsx";
import ExternalLinks from "./tools/externalLink.jsx";

var defaultState = {
  activeTool: "",
};

class ToolOptions extends Component {
  /**
   *
   */
  constructor() {
    super();
    this.state = defaultState;
  }

  componentDidMount() {
    this.props.model.on(
      "change:urlMapConfig",
      this.onUrlMapConfigChanged.bind(this)
    );
  }

  componentWillUnmount() {
    this.props.model.off(
      "change:urlMapConfig",
      this.onUrlMapConfigChanged.bind(this)
    );
  }

  onUrlMapConfigChanged() {
    const t = this.state.activeTool;
    this.setState({
      activeTool: "",
    });
    setTimeout(() => {
      this.setState({
        activeTool: t,
      });
    }, 20);
  }

  getActiveTool(tool) {
    switch (tool) {
      case "anchor":
        return <Anchor parent={this} model={this.props.model} />;
      case "buffer":
        return <Buffer parent={this} model={this.props.model} />;
      case "bookmarks":
        return <Bookmarks parent={this} model={this.props.model} />;
      case "coordinates":
        return <Coordinates parent={this} model={this.props.model} />;
      case "draw":
        return <Draw parent={this} model={this.props.model} />;
      case "layercomparer":
        return <LayerComparer parent={this} model={this.props.model} />;
      case "sketch":
        return <Sketch parent={this} model={this.props.model} />;
      case "edit":
        return <Edit parent={this} model={this.props.model} />;
      case "export":
        return <Export parent={this} model={this.props.model} />;
      case "fmeServer":
        return <FmeServer parent={this} model={this.props.model} />;
      case "print":
        return <Print parent={this} model={this.props.model} />;
      case "infoclick":
        return <Infoclick parent={this} model={this.props.model} />;
      case "information":
        return <Information parent={this} model={this.props.model} />;
      case "informative":
        return <Informative parent={this} model={this.props.model} />;
      case "dummy":
        return <Dummy parent={this} model={this.props.model} />;
      case "location":
        return <Location parent={this} model={this.props.model} />;
      case "search":
        return <Search parent={this} model={this.props.model} />;
      case "streetview":
        return <StreetView parent={this} model={this.props.model} />;
      case "preset":
        return <Preset parent={this} model={this.props.model} />;
      case "externalLinks":
        return <ExternalLinks parent={this} model={this.props.model} />;
      case "measure":
        return <Measure parent={this} model={this.props.model} />;
      case "routing":
        return <Routing parent={this} model={this.props.model} />;
      case "collector":
        return <Collector parent={this} model={this.props.model} />;
      case "timeslider":
        return <TimeSlider parent={this} model={this.props.model} />;
      case "documenthandler":
        return <MenuEditor parent={this} model={this.props.model} />;
      case "geosuiteexport":
        return <GeosuiteExport parent={this} model={this.props.model} />;
      case "visionintegration":
        return <VisionIntegration parent={this} model={this.props.model} />;
      default:
        return null;
    }
  }

  toggleTool(tool) {
    this.setState({
      activeTool: tool,
    });
  }

  getIndexForTool(tool) {
    var found = false;
    if (Array.isArray(this.props.model.get("toolConfig"))) {
      found = this.props.model.get("toolConfig").filter((t) => t.type === tool);
    }

    if (found[0]) {
      return found[0].index;
    } else {
      return -1;
    }
  }

  getClassNamesForActive(tool) {
    var found = false;
    if (Array.isArray(this.props.model.get("toolConfig"))) {
      found =
        this.props.model.get("toolConfig").filter((t) => t.type === tool)
          .length > 0;
    }
    return found ? "fa fa-check-square-o" : "fa fa-square-o";
  }

  getClassNamesForSelected(tool) {
    return this.state.activeTool === tool
      ? "layer-item selected"
      : "layer-item";
  }

  render() {
    var toolTypes = {
      anchor: "Länk till kartan",
      buffer: "Skapa buffertzon",
      bookmarks: "Bokmärken",
      coordinates: "Fånga koordinat",
      draw: "Rita och mäta",
      layercomparer: "Jämför lager sida vid sida",
      sketch: "Rita och mäta (Version 2)",
      edit: "Editering",
      export: "Utskrift",
      fmeServer: "FME-server",
      print: "Utskrift (på klienten)",
      infoclick: "Infoklick",
      information: "Om kartan",
      informative: "Dokumenthanterare",
      search: "Sök",
      streetview: "Google Street View",
      preset: "Snabbval",
      externalLinks: "Externa länkar",
      measure: "Mät",
      location: "Visa min position",
      routing: "Navigation",
      collector: "Tyck till",
      dummy: "Dummy plugin",
      timeslider: "Tidslinje",
      documenthandler: "Dokumenthanterare 2.0",
      visionintegration: "Vision-integration",
      geosuiteexport: "GeoSuite export",
    };

    return (
      <div>
        <aside>
          <ul className="config-layer-list">
            {Object.keys(toolTypes)
              .sort((a, b) =>
                this.getIndexForTool(a) === this.getIndexForTool(b)
                  ? 0
                  : this.getIndexForTool(a) > this.getIndexForTool(b)
                  ? 1
                  : -1
              )
              .map((key, i) => {
                var index = this.getIndexForTool(key);
                return (
                  <li
                    key={i}
                    className={this.getClassNamesForSelected(key)}
                    onClick={() => this.toggleTool(key)}
                  >
                    <span className={this.getClassNamesForActive(key)} />
                    &nbsp;
                    <span>
                      {toolTypes[key]} ({index})
                    </span>
                  </li>
                );
              })}
          </ul>
        </aside>
        <article>
          <fieldset className="tree-view">
            <legend>Verktygsinställningar</legend>
            <div>{this.getActiveTool(this.state.activeTool)}</div>
          </fieldset>
        </article>
      </div>
    );
  }
}

export default ToolOptions;
