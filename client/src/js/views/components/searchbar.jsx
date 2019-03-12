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

var SelectionToolbar = require("components/selectiontoolbar");
var SearchResultGroup = require("components/searchresultgroup");

/**
 * @class
 */
var SearchBarView = {
  /**
   * @property {string} valueBar
   * @instance
   */
  valueBar: undefined,

  /**
   * @property {number} timer
   * @instance
   */
  timer: undefined,

  /**
   * @property {number} loading
   * @instance
   */
  loading: 0,

  /**
   * Get initial state.
   * @instance
   * @return {object}
   */
  getInitialState: function() {
    return {
      visible: false,
      displayPopup: this.props.model.get("displayPopupBar"),
      haveUrlSearched: false,
      updateCtr: 2,
      sAndVSearch: false,
      filters: []
    };
  },

  /**
   * Triggered when the component is successfully mounted into the DOM.
   * @instance
   */
  componentDidMount: function() {
    this.valueBar = this.props.model.get("valueBar");
    if (this.props.model.get("barItems")) {
      this.setState({
        showResults: true,
        result: {
          status: "success",
          items: this.props.model.get("barItems")
        }
      });
    }

    this.props.model.on("change:displayPopupBar", () => {
      this.setState({
        displayPopup: this.props.model.get("displayPopupBar")
      });
    });

    var str, result, typeName;

    // get s and v
    var paramGet = function(name) {
      var match = RegExp("[?&]" + name + "=([^&]*)").exec(
        window.location.search
      );
      return match && decodeURIComponent(match[1].replace(/\+/g, " "));
    };

    var s = paramGet("s");
    var v = paramGet("v");

    if (s == null) {
      this.props.model.set("filter", "*");
    } else {
      var filterName = "*";
      this.props.model.get("sources").map((wfslayer, i) => {
        if (s.toUpperCase() == wfslayer.caption.toUpperCase()) {
          filterName = wfslayer.caption;
        }
      });
      this.props.model.set("filter", filterName);
    }

    if (!this.state.haveUrlSearched && typeof v !== "undefined" && v != null) {
      var field = document.getElementById("searchbar-input-field");
      field.value = v;
      this.valueBar = v;
      this.props.model.set("valueBar", this.valueBar);
      this.setState({
        valueBar: this.valueBar,
        minimized: false,
        force: true,
        sAndVSearch: true,
        selectionTool: false,
        selectionList: false
      });
      this.props.model.set("force", true);
      this.search(); // always search on url-query
    }
  },

  componentDidUpdate: function() {
    var hit = document.getElementById("hit-0-group-0");
    if (!this.state.haveUrlSearched && hit != null && this.state.sAndVSearch) {
      try {
        hit.click();
        this.state.haveUrlSearched = true;
        this.state.sAndVSearch = false;
      } catch (err) {}
    }
  },

  /**
   * Triggered before the component mounts.
   * @instance
   */
  componentWillMount: function() {
    this.props.model.get("layerCollection")
      ? this.bindLayerVisibilityChange()
      : this.props.model.on(
          "change:layerCollection",
          this.bindLayerVisibilityChange
        );
  },

  /**
   * Triggered when component unmounts.
   * @instance
   */
  componentWillUnmount: function() {
    this.props.model.get("layerCollection").each(layer => {
      layer.off("change:visible", this.search);
    });
    this.props.model.off(
      "change:layerCollection",
      this.bindLayerVisibilityChange
    );
    this.props.model.off("change:displayPopupBar");
  },

  /**
   * Clear the search result.
   * @instance
   */
  clear: function() {
    if (typeof $("#sokRensa") !== "undefined") {
      $("#sokRensa").click();
    }
    this.valueBar = "";
    this.props.model.set("valueBar", "");
    this.props.model.clear();
    this.setState({
      loading: false,
      showResults: true,
      result: []
    });
  },

  /**
   * Handle key down event, this will set state.
   * @instance
   * @param {object} event
   */
  handleKeyDown: function(event) {
    //this.props.model.set('filter', '*');
    this.state.sAndVSearch = false;
    this.state.haveUrlSearched = true;
    if (event.keyCode === 13 && event.target.value.length < 5) {
      event.preventDefault();
      this.props.model.set("valueBar", event.target.value);
      this.setState({
        force: true
      });
      this.props.model.set("force", true);
      this.state.sAndVSearch = false;
      this.search();
    }
  },

  toggleMinimize: function() {
    this.setState({
      minimized: !this.state.minimized
    });
  },

  toggleSelectionTool: function() {
    this.setState({
      selectionTool: !this.state.selectionTool
    });
  },

  toggleSelectionList: function() {
    this.setState({
      selectionList: !this.state.selectionList
    });
  },

  /**
   * Perform a search in the model to update results.
   * @instance
   */
  update: function() {
    this.props.model.search();
  },

  /**
   * Search requested information.
   * @instance
   * @param {object} event
   */
  search: function(event) {
    var valueBar = this.props.model.get("valueBar");
    var features = this.props.model.get("selectionModel");

    if (valueBar.length || features.getFeatures().length) {
      this.setState({
        loading: true
      });

      this.loading = Math.random();
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        var loader = this.loading;
        this.props.model.abort();
        this.props.model.search(result => {
          var state = {
            loading: false,
            showResults: true,
            result: result
          };
          if (loader !== this.loading) {
            state.loading = true;
          }
          this.setState(state);
        }, true);
      }, 200);
    }
  },

  /**
   * Bind an event handler to layer visibility change.
   * If a layer changes visibility the result vill update.
   * @instance
   */
  bindLayerVisibilityChange: function() {
    this.props.model.get("layerCollection").each(layer => {
      layer.on("change:visible", () => {
        // this.update(); // causes a search to be done everytime a layer's visibility changes. Then it only searches in adresser and fastighet
      });
    });
  },

  /**
   * Set search filter.
   * @instance
   * @param {string} type
   * @param {object} event
   *
   */
  setFilter: function(event) {
    //this.props.model.set('filter', event.target.value);
    var addFilter = this.state.filters.slice();

    event.target.value === "*" ? (addFilter = []) : false;

    var index = addFilter.indexOf(event.target.value);

    //Add to filters or remove if value already exist
    addFilter.includes(event.target.value)
      ? index > -1
        ? addFilter.splice(index, 1)
        : false
      : addFilter.push(event.target.value);

    this.setState({
      filters: addFilter
    });

    if (event.target.value != "*" && addFilter.includes("*")) {
      addFilter.splice(addFilter.indexOf("*"), 1);
    }

    this.props.model.set("filter", addFilter);
  },

  /**
   * Render the search options component.
   * @instance
   * @return {external:ReactElement}
   */
  renderOptions: function() {
    var settings = this.props.model.get("settings"),
      sources = this.props.model.get("sources");
    return (
      <div className="options-container">
        <div
          className={
            this.state.selectionList ? "options-layers open" : "options-layers"
          }
        >
          <div className="options-title">
            <b>Lager</b>
          </div>
          <button
            className="btn btn-filter"
            type="button"
            onClick={this.toggleSelectionList}
          >
            {!this.state.filters.length || this.state.filters.includes("*")
              ? "Alla lager"
              : this.state.filters.length > 1
              ? "Flera lager"
              : this.state.filters}
            <i className="fa fa-angle-down clickable arrow" />
          </button>

          <ul
            className="dropdown-menu"
            onChange={e => {
              this.setFilter(e);
            }}
          >
            <li>
              <label>
                <input
                  id="labels-checkbox"
                  type="checkbox"
                  value="*"
                  checked={
                    !this.state.filters.length ||
                    this.state.filters.includes("*")
                  }
                />
                <span
                  className={
                    !this.state.filters.length ||
                    this.state.filters.includes("*")
                      ? "selected"
                      : ""
                  }
                >
                  Alla lager
                </span>
              </label>
            </li>

            {(() => {
              return sources
                .sort(function(a, b) {
                  if (a.caption < b.caption) {
                    return -1;
                  }
                  if (a.caption > b.caption) {
                    return 1;
                  }
                  return 0;
                })
                .map((wfslayer, i) => {
                  return (
                    <li
                      key={i}
                      className={
                        this.state.filters.indexOf(wfslayer.caption) > -1
                          ? "selected"
                          : ""
                      }
                    >
                      <label>
                        <input
                          id="labels-checkbox"
                          type="checkbox"
                          value={wfslayer.caption}
                          checked={this.state.filters.includes(
                            wfslayer.caption
                          )}
                        />
                        <span
                          className={
                            this.state.filters.includes(wfslayer.caption)
                              ? "selected"
                              : ""
                          }
                        >
                          {wfslayer.caption}
                        </span>
                      </label>
                    </li>
                  );
                });
            })()}
          </ul>
        </div>
      </div>
    );
  },

  onChangeDisplayPopup: function(e) {
    this.props.model.set("displayPopupBar", e.target.checked);
  },

  exportSelected: function(type) {
    this.props.model.export(type);
  },

  searchOnInput: function(event) {
    if (this.state.sAndVSearch) {
      return; // Internet Explorer calls this function before the sAndVSearch can finish. We therefore have to return
      // until the sAndVSearch is finished.
    }
    //this.props.model.set('filter', '*');
    this.valueBar = event.target.value;
    this.props.model.set("valueBar", this.valueBar);
    this.setState({
      valueBar: this.valueBar,
      minimized: false,
      force: false
    });
    this.props.model.set("force", false);
    if (this.refs.searchInput.value.length > 3) {
      this.search();
    } else {
      this.setState({
        loading: false
      });
    }
  },

  searchOnClick: function(event) {
    this.state.sAndVSearch = false;
    this.state.haveUrlSearched = true;

    this.setState({
      force: true
    });
    this.props.model.set("force", true);
    this.state.sAndVSearch = false;
    this.search();
  },

  /**
   * Render the search options component.
   * @instance
   * @return {external:ReactElement}
   */
  renderSearchButton: function() {
    return (
      <button
        className="btn btn-primary"
        onClick={this.searchOnClick}
        title="Sök"
      >
        Sök
      </button>
    );
  },

  /**
   * Render the result component.
   * @instance
   * @return {external:ReactElement}
   */
  renderResults: function() {
    var valueBar = this.props.model.get("valueBar");
    var features = this.props.model.get("selectionModel");

    if (valueBar.length || features.getFeatures().length) {
      var groups = this.props.model.get("barItems");

      const resultsCount = groups.reduce(
        (result, group) => result + group.hits.length,
        0
      );

      const enable_checkbox = this.props.model.get(
        "enableViewTogglePopupInSnabbsok"
      );
      const checkbox = (
        <div>
          <input
            type="checkbox"
            id="display-popup"
            ref="displayPopup"
            onChange={e => {
              this.onChangeDisplayPopup(e);
            }}
            checked={this.state.displayPopup}
          />
          <label htmlFor="display-popup">Visa information</label>
        </div>
      );

      const resultStyle = {
        display: this.state.minimized ? "none" : "block"
      };

      return (
        <div className="searchbar-area" key="searchbar-results">
          {groups && groups.length > 0 ? (
            <div>
              <div className="searchbar-results">
                <h3 id="searchbar-results-title">
                  <span className="search-results-title">Sökresultat</span>
                  <div
                    onClick={this.toggleMinimize}
                    className="search-results-toggle-minimze"
                  >
                    {this.state.minimized ? (
                      <span>
                        Visa{" "}
                        <span
                          className="fa fa-chevron-circle-down search-results-btn-icon clickable arrow"
                          title="Visa sökresultat"
                        />
                      </span>
                    ) : (
                      <span>
                        Dölj{" "}
                        <span
                          className="fa fa-chevron-circle-up search-results-btn-icon clickable arrow"
                          title="Dölj sökresultat"
                        />
                      </span>
                    )}
                  </div>
                </h3>
                <div id="searchbar-results-info">
                  <span>Sökningen </span>
                  {valueBar.length ? (
                    valueBar.length && features.getFeatures().length ? (
                      <span>
                        <b>"{valueBar}"</b> och med <b>område</b>
                      </span>
                    ) : (
                      <span>
                        <b>"{valueBar}"</b>
                      </span>
                    )
                  ) : features.getFeatures().length ? (
                    <span>
                      med <b>område</b>
                    </span>
                  ) : (
                    ""
                  )}
                  <span> gav</span>
                  {resultsCount > 0 ? (
                    <span className="search-results-total-count">
                      {resultsCount}
                    </span>
                  ) : null}
                  <span> träffar.</span>
                </div>
                <div id="searchbar-results-list" style={resultStyle}>
                  {enable_checkbox ? checkbox : null}
                  {groups.map((item, i) => {
                    var id = "group-" + i;
                    return (
                      <SearchResultGroup
                        isBar="yes"
                        id={id}
                        key={id}
                        result={item}
                        numGroups={groups.length}
                        model={this.props.model}
                        parentView={this}
                        map={this.props.model.get("map")}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="searchbar-results-no-results">
              Sökningen gav inget resultat.
            </div>
          )}
        </div>
      );
    }
  },

  /**
   * Render the selection tool.
   * @instance
   * @return {external:ReactElement}
   */
  renderSelectionTool: function() {
    const selectionTool = this.state.selectionTool;
    var selectionToolbar = this.props.model.get("selectionTools") ? (
      <SelectionToolbar model={this.props.model.get("selectionModel")} />
    ) : null;

    var options = this.renderOptions(),
      searchBtn = this.renderSearchButton();

    return selectionTool ? (
      <div className="searchbar-results selection-toolbar-container">
        {options}
        {selectionToolbar}

        <div className="options-search">
          {searchBtn}&nbsp;
          <button
            id="searchbar-clear-button"
            className="btn btn-primary"
            title="Rensa sökning"
            onClick={() => {
              this.clear();
            }}
          >
            Rensa
          </button>
        </div>
      </div>
    ) : null;
  },

  /**
   * Render the panel component.
   * @instance
   * @return {external:ReactElement}
   */
  render: function() {
    var valueBar = this.props.model.get("valueBar"),
      showResults, //= this.props.model.shouldRenderResult(true),
      options = this.renderOptions();

    const Loading = (
      <div id="searchbar-loading-spinner">
        <span className="sr-only">Laddar...</span>
        <i className="fa fa-refresh fa-spin fa-2x fa-fw" />
      </div>
    );

    const shouldRenderSearchResults =
      this.refs.searchInput &&
      (this.refs.searchInput.value.length > 3 ||
        this.props.model.get(
          "force"
        )); /*&& this.refs.searchInput.value.length > 0*/

    if (shouldRenderSearchResults) {
      showResults = true;
    }

    const AlertSearchBar = (
      <p className="alert alert-info" id="alertSearchbar">
        Skriv minst fyra tecken för att påbörja automatisk sökning. Tryck på{" "}
        <b>retur</b> för att forcera en sökning.
      </p>
    );

    const inputClassName =
      this.state.loading ||
      (showResults && !this.state.loading && shouldRenderSearchResults)
        ? "form-control searchbar-input-field-active"
        : "form-control";
    const buttonClassName =
      this.state.loading ||
      (showResults && !this.state.loading && shouldRenderSearchResults)
        ? "input-group-addon searchbar-search-button-active search-btn"
        : "input-group-addon search-btn";
    const enable_selectionTool = this.props.model.get("enableSelectionTool");
    const showSelectionTool = this.state.selectionTool
      ? "input-group-addon searchbar-search-button-active selection-btn"
      : "input-group-addon selection-btn";

    return (
      <div className="search-tools">
        <div className="input-group" id="searchbar-search-area">
          {valueBar ? (
            <div
              id="searchbar-input-field-clear"
              className={enable_selectionTool ? "selection-tool-enabled" : ""}
              title="Rensa sökning"
              onClick={() => {
                this.clear();
              }}
            />
          ) : null}
          <input
            id="searchbar-input-field"
            type="text"
            ref="searchInput"
            className={inputClassName}
            placeholder="Sök i kartan..."
            value={valueBar}
            onKeyDown={this.handleKeyDown}
            onChange={this.searchOnInput}
          />
          <div
            id="searchbar-search-button"
            className={buttonClassName}
            onClick={this.searchOnClick}
            title="Sök"
          >
            <i className="fa fa-search" />
          </div>
          {enable_selectionTool ? (
            <div
              id="searchbar-selection-tool-button"
              className={showSelectionTool}
              onClick={this.toggleSelectionTool}
              title="Fler sökalternativ"
            >
              <i
                className={
                  this.state.selectionTool
                    ? "fa fa-chevron-circle-up clickable arrow"
                    : "fa fa-chevron-circle-down clickable arrow"
                }
              />
            </div>
          ) : null}
        </div>
        {this.renderSelectionTool()}
        {showResults
          ? this.state.loading
            ? Loading
            : shouldRenderSearchResults
            ? this.renderResults()
            : AlertSearchBar
          : null}
      </div>
    );
  }
};
/**
 *
 * Ta bort sök alternative ovanför {results} above
 *         <div className="search-options">{options}</div>
 */

/**
 * SearchBarView module.<br>
 * Use <code>require('components/searchbar')</code> for instantiation.
 * @module SearchBarView-module
 * @returns {SearchBarView}
 */
module.exports = React.createClass(SearchBarView);
