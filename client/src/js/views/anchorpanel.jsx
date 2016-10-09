
var Panel = require('views/panel');
/**
 * @class
 */
var AnchorPanelView = {
  /**
   * Get initial state.
   * @instance
   * @return {object}
   */
  getInitialState: function() {
    return {
      anchor: ""
    };
  },

  /**
   * Triggered when component updates.
   * @instance
   */
  componentDidUpdate: function () {
  },

  /**
   * Triggered when the component is successfully mounted into the DOM.
   * @instance
   */
  componentDidMount: function () {
    this.generate();
  },

  /**
   * Generete anchor text.
   * @instance
   */
  generate: function () {
    this.setState({
      anchor: this.props.model.generate()
    });
  },

  /**
   * Render the view
   * @instance
   * @return {external:ReactElement}
   */
  render: function () {
    var anchor = this.props.model.get('anchor');
    return (
      <Panel title="Länk till karta" onCloseClicked={this.props.onCloseClicked}>
        <div className="panel-content">
          <button onClick={this.generate} className="btn btn-default">Uppdatera länk</button>
          <p>
            En direktlänk har genererats som visar aktuell utbretning, zoomnivå och tända/släckta lager.<br/>
            Tryck på länken nedan för att öppna kartan i ny flik för exempelvis bokmärkning.<br/>
            Högerklika på länken och välj kopiera genväg för att spara länken i urklipp för inklistring i ett e-mail exempelvis.<br/>
          </p>
          <div className="alert alert-success">
            <a target="_blank" href={anchor}>Länk</a>
          </div>
        </div>
      </Panel>
    );
  }
};

/**
 * AnchorPanelView module.<br>
 * Use <code>require('views/anchorpanel')</code> for instantiation.
 * @module AnchorPanelView-module
 * @returns {AnchorPanelView}
 */
module.exports = React.createClass(AnchorPanelView);