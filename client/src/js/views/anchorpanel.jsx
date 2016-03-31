var Panel = require('views/panel');
/**
 * React Class Anchor Panel
 * @class
 */
var AnchorPanel = React.createClass({
  /**
   * @desc Get initial state
   * @override
   * @return {object}
   */
  getInitialState: function() {
    return {
      anchor: ""
    };
  },
  /**
   * @desc Triggered when component updates.
   * @override
   */
  componentDidUpdate: function () {
  },
  /**
   * @descTriggered when the component is successfully mounted into the DOM.
   * @override
   */
  componentDidMount: function () {
    this.generate();
  },
  /**
   * @desc Generete anchor to map.
   * @retur {string} anchor
   */
  generate: function () {

    this.setState({
      anchor: this.props.model.generate()
    });

  },
  /**
   * @desc Render anchorpanel.
   * @return {React.Component}
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

});


module.exports = AnchorPanel;