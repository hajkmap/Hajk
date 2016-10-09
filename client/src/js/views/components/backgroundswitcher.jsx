/**
 * @class
 */
var BackgroundSwitcherView = {

  /**
   * Get initial state.
   * @instance
   * @return {object}
   */
  getInitialState: function () {
    return {
      displayMode: 'hidden',
      displayModeClass: 'fa fa-plus-circle'
    }
  },

  /**
   * Triggered when the component is successfully mounted into the DOM.
   * @instance
   */
  componentDidMount: function () {
    this.backgroundSwitcherModeChanged();
    this.props.model.on('change:backgroundSwitcherMode', () => {
      this.backgroundSwitcherModeChanged()
    });
    this.setState({
      selected: this.props.model.get('background')
    })
  },

  /**
   * Triggered when component unmounts.
   * @instance
   */
  componentWillUnmount: function () {
    this.props.model.off('change:backgroundSwitcherMode');
  },

  /**
   * Event handler for background switcher mode changes
   * @instance
   */
  backgroundSwitcherModeChanged: function () {
    var mode = this.props.model.get('backgroundSwitcherMode')
    ,   cls  = (this.props.model.get('backgroundSwitcherMode') === 'hidden') ? 'fa fa-plus-circle' : 'fa fa-minus-circle'
    ;
    this.setState({
      displayMode: mode,
      displayModeClass: cls
    });
  },

  /**
   * Set black background
   * @instance
   */
  setBlackBackground: function () {
    this.clear();
    $('#map').css({background: 'black'});
    this.setState({
      "selected" : 'black'
    });
    this.props.model.set('background', 'black');
  },

  /**
   * Set white background
   * @instance
   */
  setWhiteBackground: function () {
    this.clear();
    $('#map').css({background: 'white'});
    this.setState({
      "selected" : 'white'
    });
    this.props.model.set('background', 'white');
  },

  /**
   * Hide current background layer
   * @instance
   */
  clear: function() {
    this.props.layers.forEach(baselayer => {
      baselayer.setVisible(false);
      baselayer.getLayer().setVisible(false);
    });
  },

  /**
   * Set background layer
   * @instance
   * @param {Layer} layer
   */
  setBackgroundLayer: function (layer) {
    $('#map').css({background: 'white'});
    this.props.layers.forEach(baselayer => {
      var visible = baselayer.id === layer.id;
      baselayer.setVisible(visible);
      baselayer.getLayer().setVisible(visible);
    });
    this.setState({
      "selected" : layer.id
    })
    this.props.model.set('background', layer.id);
  },

  /**
   * Set visibility of background layer
   * @instance
   */
  setVisibility: function() {
    this.props.model.set('backgroundSwitcherMode',
      this.props.model.get('backgroundSwitcherMode') === 'hidden' ? '' : 'hidden'
    );
  },

  /**
   * Check if given layer is the selected layer
   * @instance
   * @param {Layer} layer
   */
  getSelected: function (layer) {
    if (this.state && this.state.selected) {
      if (this.state.selected === layer.get('id')) {
        return true;
      }
    }
    return this.props.layers.filter(l =>
      l.getVisible() && l.id === layer.id
    ).length === 1;
  },

  /**
   * Render the layers component.
   * @instance
   * @return {external:ReactElement}
   */
  renderLayers: function () {
    return (
      this.props.layers.map((layer, i) => {
        var index = "background-layer-" + i
        ,   checked = this.getSelected(layer);
        return (
          <li key={index}>
            <input id={index} name="background" type="radio" checked={checked} onChange={(e) => this.setBackgroundLayer(layer) }></input>
            <label htmlFor={index}>{layer.get('caption')}</label>
          </li>
        );
      })
    )
  },

  /**
   * Render the background switcher component.
   * @instance
   * @return {external:ReactElement}
   */
  render: function () {
    var black = white = false;
    if (this.state.selected === 'black')
      black = true;
    if (this.state.selected === 'white')
      white = true;
    return (
      <div className="background-switcher">
        <h3 onClick={this.setVisibility} ><span className={this.state.displayModeClass}></span>&nbsp;Bakgrundskartor</h3>
        <ul className={this.state.displayMode}>
          {this.renderLayers()}
          <li key="-2">
            <input id="-2" name="background" type="radio" checked={white} onChange={() => this.setWhiteBackground() }></input>
            <label htmlFor="-2">Vit bakgrund</label>
          </li>
          <li key="-1">
            <input id="-1" name="background" type="radio" checked={black} onChange={() => this.setBlackBackground() }></input>
            <label htmlFor="-1">Svart bakgrund</label>
          </li>

        </ul>
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
module.exports = React.createClass(BackgroundSwitcherView);