import React from 'react';
import { Component } from 'react';
import Anchor from "./tools/anchor.jsx";
import Bookmark from "./tools/bookmark.jsx";
import Coordinates from "./tools/coordinates.jsx";
import Draw from "./tools/draw.jsx";
import Edit from "./tools/edit.jsx";
import Export from "./tools/export.jsx";
import Infoclick from "./tools/infoclick.jsx";
import Information from "./tools/information.jsx";
import Search from "./tools/search.jsx";
import StreetView from "./tools/streetview.jsx";

var defaultState = {
  activeTool: undefined,
};

class ToolOptions extends Component {
  /**
   *
   */
  constructor() {
    super();
    this.state = defaultState;
  }

  getActiveTool(tool) {
    switch (tool) {
      case "anchor":
        return <Anchor parent={this} model={this.props.model}></Anchor>
      case "bookmark":
        return <Bookmark parent={this} model={this.props.model}></Bookmark>
      case "coordinates":
        return <Coordinates parent={this} model={this.props.model}></Coordinates>
      case "draw":
        return <Draw parent={this} model={this.props.model}></Draw>
      case "edit":
        return <Edit parent={this} model={this.props.model}></Edit>
      case "export":
        return <Export parent={this} model={this.props.model}></Export>
      case "infoclick":
        return <Infoclick parent={this} model={this.props.model}></Infoclick>;
      case "information":
        return <Information parent={this} model={this.props.model}></Information>
      case "search":
        return <Search parent={this} model={this.props.model}></Search>
      case "streetview":
        return <StreetView parent={this} model={this.props.model}></StreetView>
      default:
        return null;
    }
  }

  toggleTool(tool) {
    this.setState({
      activeTool: tool
    });
  }

  getClassNamesForActive(tool) {
    var found = false;
    if (Array.isArray(this.props.model.get('toolConfig'))) {
      found = this.props.model
        .get('toolConfig')
        .filter(t => t.type === tool).length > 0;
    }
    return found ? "fa fa-check-square-o" : "fa fa-square-o";
  }

  getClassNamesForSelected(tool) {
    return this.state.activeTool === tool ? "layer-item selected" : "layer-item";
  }

  render() {
    var toolTypes = {
      anchor: "Länk till kartan",
      bookmark: "Bokmärken",
      coordinates: "Fånga koordinat",
      draw: "Rita och måttsätt",
      edit: "Editering",
      export: "Utskrift",
      infoclick: "Infoklick",
      information: "Om kartan",
      search: "Sök",
      streetview: "Google Street View"
    };
    return (
      <div>
        <aside>
          <ul className="config-layer-list">
            {
              Object.keys(toolTypes).map((key, i) => {
                return <li
                  key={i}
                  className={this.getClassNamesForSelected(key)}
                  onClick={() => this.toggleTool(key)}>
                    <span className={this.getClassNamesForActive(key)}></span>
                    &nbsp;
                    <span>{toolTypes[key]}</span>
                </li>
              })
            }
          </ul>
        </aside>
        <article>
          <fieldset className="tree-view">
            <legend>Verktygsinställningar</legend>
            <div>
                {this.getActiveTool(this.state.activeTool)}
            </div>
          </fieldset>
        </article>
      </div>
    )
  }
}

export default ToolOptions;
