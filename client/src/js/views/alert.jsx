/**
 *
 */
class Alert extends React.Component {

  constructor() {
    super();
  }

  render() {
    var options = this.props.options;
    if (options.confirm) {
      return !options.visible ? false : (
        <div className="modal">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Bekräfta</h4>
              </div>
              <div className="modal-body">
                <p>
                  {options.message.split('\n').map(function(text, i) {
                    return (
                      <span key={i}>
                        <span>{text}</span>
                        <br/>
                      </span>
                    )
                  })}
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={options.denyAction} className="btn btn-default">Avbryt</button>&nbsp;
                <button type="button" onClick={options.confirmAction} className="btn btn-primary">OK</button>
              </div>
            </div>
          </div>
        </div>
      )
    } else {
      return !options.visible ? false : (
        <div className="modal">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Meddelande</h4>
              </div>
              <div className="modal-body">
                <p>
                  {options.message.split('\n').map(function(text, i) {
                    return (
                      <span key={i}>
                        <span>{text}</span>
                        <br/>
                      </span>
                    )
                  })}
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={options.onClick} className="btn btn-default">OK</button>
              </div>
            </div>
          </div>
        </div>
      )
    }
  }
}

module.exports = Alert;