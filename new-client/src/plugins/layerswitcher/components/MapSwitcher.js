import React, { Component } from "react";

const fetchConfig = {
  credentials: "same-origin"
};

class MapSwitcher extends Component {
  constructor() {
    super();
    this.state = {
      availableMaps: []
    };
  }

  componentDidMount() {
    if (this.props.options.dropdownThemeMaps === true) {
      this.fetchAvailableMaps().catch(err => console.error(err));
    }
  }

  async fetchAvailableMaps() {
    let response = await fetch(
      `${this.props.appConfig.proxy}${
        this.props.appConfig.mapserviceBase
      }/config/userspecificmaps`,
      fetchConfig
    );
    let data = await response.json();
    this.setState({ availableMaps: data });
  }

  renderAvailableMaps() {
    return this.state.availableMaps.map((theme, i) => (
      <option key={i} value={theme.mapConfigurationName}>
        {theme.mapConfigurationTitle}
      </option>
    ));
  }

  renderMapSwitcher() {
    let caption = this.props.options.dropdownThemeMaps;
    let captionHtml = "";
    if (caption !== null && caption.length > 0) {
      captionHtml = `<span class="mapSwitcherCaption">${caption}</span>`;
    }

    return (
      <div>
        {captionHtml}
        <select
          className="custom-select"
          onChange={this.setThemeMap}
          style={{ marginBottom: "10px", width: "100%" }}
          //value={this.state.dropDownValue} // FIXME: Find a way to determine name of current map config, eg map_1 or map_2. It's tricky, as it isn't to be found anywhere in mapConfig or appConfig
        >
          {this.renderAvailableMaps()}
        </select>
      </div>
    );
  }

  render() {
    return this.props.options.dropdownThemeMaps === true
      ? this.renderMapSwitcher()
      : false;
  }
}

export default MapSwitcher;
