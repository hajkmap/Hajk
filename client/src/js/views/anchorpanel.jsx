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
          <div>Skapa en länkt till aktuell kartbild. Du kan spara den som ett eget bokmärke eller dela med en kollega.</div>
          <button onClick={this.generate} className="btn btn-default">Uppdatera länk</button>
          <div>
            <a target="_blank" href={anchor}>Länk</a>
          </div>
        </div>
      </Panel>
    );
  }

});


module.exports = AnchorPanel;