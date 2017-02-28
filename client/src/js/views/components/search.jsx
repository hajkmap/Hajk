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

var SelectionToolbar = require('components/selectiontoolbar');
var SearchResultGroup = require('components/searchresultgroup');

/**
 * @class
 */
var SearchView = {
  /**
   * @property {string} value
   * @instance
   */
  value: undefined,

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
      displayPopup: this.props.model.get('displayPopup')
    };
  },

  /**
   * Triggered when the component is successfully mounted into the DOM.
   * @instance
   */
  componentDidMount: function () {
    this.value = this.props.model.get('value');
    if (this.props.model.get('items')) {
      this.setState({
        showResults: true,
        result: {
          status: 'success',
          items: this.props.model.get('items')
        }
      });
    }

    this.props.model.on("change:displayPopup", () => {
      this.setState({
        displayPopup: this.props.model.get('displayPopup')
      });
    });

  },

  /**
   * Triggered before the component mounts.
   * @instance
   */
  componentWillMount: function () {
    this.props.model.get('layerCollection') ?
      this.bindLayerVisibilityChange() :
      this.props.model.on('change:layerCollection', this.bindLayerVisibilityChange);
  },

  /**
   * Triggered when component unmounts.
   * @instance
   */
  componentWillUnmount: function () {
    this.props.model.get('layerCollection').each((layer) => {
      layer.off("change:visible", this.search);
    });
    this.props.model.off('change:layerCollection', this.bindLayerVisibilityChange);
    this.props.model.off("change:displayPopup");
  },

  /**
   * Clear the search result.
   * @instance
   */
  clear: function () {
    this.value = "";
    this.props.model.set('value', "");
    this.props.model.clear();
    this.setState({
      loading: true,
      showResults: true,
      result: []
    });
  },

  /**
   * Handle key down event, this will set state.
   * @instance
   * @param {object} event
   */
  handleKeyDown: function (event) {
    if (event.keyCode === 13 && event.target.value.length < 5) {
      event.preventDefault();
      this.props.model.set('value', event.target.value);
      this.setState({
        force: true
      });
      this.props.model.set('force', true);
      this.search();
    }
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
  search: function (event) {
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
      });
    }, 200);
  },

  /**
   * Bind an event handler to layer visibility change.
   * If a layer changes visibility the result vill update.
   * @instance
   */
  bindLayerVisibilityChange : function () {
    this.props.model.get('layerCollection').each((layer) => {
      layer.on("change:visible", () => {
        this.update();
      });
    });
  },

  /**
   * Set search filter and perform a search.
   * @instance
   * @param {string} type
   * @param {object} event
   */
  setFilter: function (event) {
    this.props.model.set('filter', event.target.value);
    this.search();
  },

  /**
   * Render the search options component.
   * @instance
   * @return {external:ReactElement}
   */
  renderOptions: function () {
    var settings = this.props.model.get('settings')
    ,   sources = this.props.model.get('sources')
    ;
    return (
      <div>
        <p>
          <span>Sök: </span>&nbsp;
          <select value={this.props.model.get('filter')} onChange={(e) => { this.setFilter(e) }}>
            <option value="*">--  Alla  --</option>
            {
              (() => {
                return sources.map((wfslayer, i) => {
                  return (
                    <option key={i} value={wfslayer.caption}>
                      {wfslayer.caption}
                    </option>
                  )
                })
              })()
            }
          </select>
        </p>
      </div>
    );
  },

  onChangeDisplayPopup: function (e) {
    this.props.model.set("displayPopup", e.target.checked);
  },

  exportSelected: function(type) {
    this.props.model.export(type);
  },

  /**
   * Render the result component.
   * @instance
   * @return {external:ReactElement}
   */
  renderResults: function () {

    var groups = this.props.model.get('items')
    ,   excelButton  = null
    ,   kmlButton  = null
    ;

    if (this.props.model.get('excelExportUrl')) {
      excelButton = (
        <button className="btn btn-default icon-button" onClick={(e) => this.exportSelected('kml')}>
          <i className="kml"></i>
        </button>
      )
    }

    if (this.props.model.get('kmlExportUrl')) {
      kmlButton = (
        <button className="btn btn-default icon-button" onClick={(e) => this.exportSelected('excel')}>
          <i className="excel"></i>
        </button>
      )
    }

    return (
      <div className="search-results" key="search-results">
        <h3>Sökresultat</h3>
        <div>
          <input type="checkbox" id="display-popup" ref="displayPopup" onChange={(e) => {this.onChangeDisplayPopup(e)}} checked={this.state.displayPopup}></input>
          <label htmlFor="display-popup">Visa information</label>
          <span className="pull-right">{excelButton}&nbsp;{kmlButton}</span>
        </div>
        {
          (() => {
            if (groups && groups.length > 0) {
              return groups.map((item, i) => {
                var id = "group-" + i;
                return (
                  <SearchResultGroup
                        id={id}
                        key={id}
                        result={item}
                        numGroups={groups.length}
                        model={this.props.model}
                        parentView={this}
                        map={this.props.model.get('map')} />
                );
              });
            } else {
              return (<div>Sökningen gav inget resultat.</div>);
            }
          })()
        }
      </div>

    );
  },

  /**
   * Render the panel component.
   * @instance
   * @return {external:ReactElement}
   */
  render: function () {

    var results = null;
    var value = this.props.model.get('value');
    var showResults = this.props.model.shouldRenderResult();
    var options = this.renderOptions();

    if (showResults) {

      if (this.state.loading) {
        results = (
          <p>
            <span className="sr-only">Laddar...</span>
            <i className="fa fa-refresh fa-spin fa-3x fa-fw"></i>
          </p>
        );
      } else {
        if ((this.refs.searchInput &&
             this.refs.searchInput.value.length > 3) ||
             this.props.model.get('force')) {
               results = this.renderResults();
        } else {
          results = (
            <p className="alert alert-info">
              Skriv minst fyra tecken för att påbörja automatisk sökning. Tryck på <b>retur</b> för att forcera en sökning.
            </p>
          )
        }

      }
    }

    var search_on_input = (event) => {
      this.value = event.target.value;
      this.props.model.set('value', this.value);
      this.setState({
        value: this.value,
        force: false
      });
      this.props.model.set('force', false);
      if (this.refs.searchInput.value.length > 3) {
        this.search();
      } else {
        this.setState({
          loading: false
        });
      }
    };

    var search_on_click = (event) => {
      this.setState({
        force: true
      });
      this.props.model.set('force', true);
      this.search();
    };

    var selectionToolbar = this.props.model.get('selectionTools')
      ? <SelectionToolbar model={this.props.model.get('selectionModel')}></SelectionToolbar>
      : null;

    return (
      <div className="search-tools">
        <div className="form-group">
          {options}
          {selectionToolbar}
          <div className="input-group">
            <div className="input-group-addon">
              <i className="fa fa-search"></i>
            </div>
            <input
              type="text"
              ref="searchInput"
              className="form-control"
              placeholder="Ange söktext.."
              value={value}
              onKeyDown={this.handleKeyDown}
              onChange={search_on_input} />
          </div>
        </div>
        <button onClick={search_on_click} type="submit" className="btn btn-default">Sök</button>&nbsp;
        <button onClick={this.clear} type="submit" className="btn btn-default">Rensa</button>
        {results}
      </div>
    );
  }
};

/**
 * SearchView module.<br>
 * Use <code>require('components/search')</code> for instantiation.
 * @module SearchView-module
 * @returns {SearchView}
 */
module.exports = React.createClass(SearchView);
