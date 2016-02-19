/**
 * React Class Filter Result Bar
 * @class
 */
var FilterResultBar = React.createClass ({
  /**
   *
   *
   */
  handleChange: function () {
    this.props.onUserInput(
      this.refs.filterTextInput.getDOMNode().value
    );
  },
  /**
   *
   *
   */
  onSubmitForm: function (e) {
    e.preventDefault();
    return false;
  },
  /**
   *
   *
   */
  render: function () {

    if (this.props.resetFilter) {
      this.resetInput();
    }

    return (
      <form onSubmit={this.onSubmitForm}>
        <div className="form-group">
          <label className="sr-only">Filter</label>
          <div className="input-group">
            <div className="input-group-addon">
            <i className="fa fa-filter"></i>
          </div>
          <input type="text"
            autoComplete="off"
            className="form-control"
            id="filter-bar"
            value={this.props.filterText}
            ref="filterTextInput"
            onChange={this.handleChange}
            placeholder="Lägg till filter..." />
            <div className="input-group-addon clickable" onClick={this.props.clearFilters}>
              <i className="fa fa-ban"></i>
            </div>
          </div>
        </div>
      </form>
    );
  }
});

module.exports = FilterResultBar;