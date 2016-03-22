var Panel = require('views/panel');
var SearchResultGroup;

SearchResultGroup = React.createClass({
  /**
   * @desc: Triggered when mounted.
   * @return: undefined
   */
  componentDidMount: function () {

    var groups = $(ReactDOM.findDOMNode(this)).find('.group');

    groups.click(function() {
      $(this).next().toggleClass('hidden');
    });

    if (this.props.model.get('selectedIndices') instanceof Array) {

      _.each(groups, group => {

        var res = this.props.model.get('selectedIndices').filter(item => group.id === item.group);

        if (res.length > 0) {
          let nth = res[0].index + 1;
          let elem = $(group).next().find('div:nth-child(' + nth + ')');
          elem.addClass('selected');
        }
      });

    }

  },
  /**
   * @desc: Handle click on result element.
   * @param: hit {olFeature}
   * @param: index {number}
   * @param: event {SyntheticEvent}
   * @return: undefined
   */
  handleClick: function (hit, index, event) {

    var element = $(event.target)
    ,   parent = $(ReactDOM.findDOMNode(this))
    ,   group = parent.find('.group');

    parent.find('div').each(function () { $(this).removeClass('selected') });
    element.addClass('selected');

    this.props.model.focus({
      index: index,
      hits: this.props.result.hits,
      hit: hit,
      id: group[0].id
    });

  },
  /**
   * @desc: Render result group component
   * @return: undefined
   */
  render: function () {

    var id = this.props.id
    var groupStyleClass = this.props.numGroups === 1 ? "" : "hidden";

    return (
      <div>
        <div className="group" id={this.props.id}>{this.props.result.layer}
          <span className="label">{this.props.result.hits.length}</span>
        </div>
        <div className={groupStyleClass}>
          {
            this.props.result.hits.map((hit, i) => {

              var hitId = "hit-" + i + "-" + id;
              var title = hit.getProperties()[this.props.result.propertyName] || this.props.result.propertyName;
              var index = i;

              return (<div key={hitId} index={i} onClick={this.handleClick.bind(this, hit, i)}>{title}</div>);
            })
          }
        </div>
      </div>
    );
  }
});

module.exports = React.createClass({
  /** @property value {string} */
  value: undefined,
  /** @property timer {number} */
  timer: undefined,
  /*
   * @desc: Get default settings.
   * @return: {object} state
   *
   */
  getInitialState: function() {
    return {
      visible: false
    };
  },
  /**
   * @desc: Clears the search result.
   *
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
   *
   */
  handleKeyDown: function (event) {
    if (event.keyCode === 13) {
      this.search();
    }
  },
  /**
   * @desc: Perform a search in the model to update results.
   */
  update: function() {
    this.props.model.search();
  },
  /**
   * @desc: Search the map for requested information.
   * @param: <ol.event> event
   * @return: undefined
   */
  search: function (event) {

    this.setState({
      loading: true
    });

    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.props.model.abort();
      this.props.model.search(result => {
        this.setState({
          loading: false,
          showResults: true,
          result: result
        });
      });
    }, 100);
  },
  /*
   * @desc
   *
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
  },
  /*
   * @desc
   */
  bindLayerVisibilityChange : function () {
    this.props.model.get('layerCollection').each((layer) => {
      layer.on("change:visible", () => {
        this.update();
      });
    });
  },
  /*
   * @desc
   */
  componentWillMount: function () {
    this.props.model.get('layerCollection') ?
      this.bindLayerVisibilityChange() :
      this.props.model.on('change:layerCollection', this.bindLayerVisibilityChange);
  },
  /*
   * @desc
   */
  componentWillUnmount: function () {
    this.props.model.get('layerCollection').each((layer) => {
      layer.off("change:visible", this.search);
    });
    this.props.model.off('change:layerCollection', this.bindLayerVisibilityChange);
  },
  /*
   * @desc
   */
  setFilter: function (type, event) {
    switch (type) {
      case "layer":
        this.props.model.set('filter', event.target.value);
        break;
      case "visible":
        this.props.model.set('filterVisible', event.target.checked);
        break;
    }
    this.search();
  },
  /*
   * @desc Render options component
   */
  renderOptions: function () {
    var settings = this.props.model.get('settings');
    return (
      <div>
        <div className="panel-row">
          <label>Sök efter </label>&nbsp;
          <select value={this.props.model.get('filter')} onChange={this.setFilter.bind(this, "layer")}>
          {
            (() => {
              return Object.keys(settings).map((setting, i) => {
                return (
                  <option key={i} value={settings[setting]}>
                    {setting}
                  </option>
                )
              })
            })()
          }
          </select>
        </div>
        <div className="panel-row">
          <label htmlFor="visible-layers">Sök endast i synliga lager</label>
          <input type="checkbox" checked={this.props.model.get('filterVisible')} onChange={this.setFilter.bind(this, "visible")} id="visible-layers"/>
        </div>
      </div>
    );
  },
  /*
   * @desc Render result component.
   */
  renderResults: function () {
    var groups = this.props.model.get('items')
    return (
      <div className="search-results" key="search-results">
        <h3>Sökresultat</h3>
        {
          (() => {
            if (groups && groups.length > 0) {
              return groups.map((item, i) => {
                var id = "group-" + i;
                var propertyName = item.propertyName;
                return (
                  <SearchResultGroup
                        id={id}
                        key={id}
                        result={item}
                        numGroups={groups.length}
                        model={this.props.model}
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
  /*
   * @desc Render the panel
   */
  render: function () {

    var results = null;
    var value = this.props.model.get('value');
    var showResults = value;
    var options = this.renderOptions();

    if (showResults) {
      if (this.state.loading) {
        results = (<h3>Laddar..</h3>);
      } else {
        results = this.renderResults();
      }
    }

    var search_on_input = (event) => {
      this.value = event.target.value;
      this.props.model.set('value', this.value);
      this.setState({ value: this.value });;
      if (this.refs.searchInput.value.length > 4) {
        this.search();
      }
    };

    return (
      <Panel title="Sök i kartan" onCloseClicked={this.props.onCloseClicked}>
        <div className="search-tools">
          <input ref="searchInput" onChange={search_on_input} onKeyDown={this.handleKeyDown} value={value} type="search" />
          {options}
          <button onClick={this.clear} type="submit" className="btn btn-default">Rensa</button>
          {results}
        </div>
      </Panel>
    );
  }
});
