var Panel = require('views/panel');

var ExportSettings = React.createClass({

  getInitialState: function() {
    return {
      selectFormat: 'A4',
      selectOrientation: 'S',
      selectScale: '10000',
      selectResolution: '72',
      loading: false
    };
  },

  getPaperMeasures: function () {

    var pageSize = format => {
      switch (format) {
        case 'A4':
          return {
            width:  this.getOrientation() === 'L' ? 297 : 210,
            height: this.getOrientation() === 'L' ? 210 : 297
          }
        case 'A3':
          return {
            width:  this.getOrientation() === 'L' ? 420 : 297,
            height: this.getOrientation() === 'L' ? 297 : 420
          }
        default: {
          return {
            width: 0,
            height: 0
          }
        }
      }
    }

    var dpi    = (25.4 / .28)
    ,   width  = pageSize(this.getFormat()).width
    ,   height = pageSize(this.getFormat()).height;

    return {
      width: ((width / 25.4) * dpi),
      height:  ((height / 25.4) * dpi)
    };
  },

  getScale: function () {
    return this.state.selectScale;
  },

  getResolution: function () {
    return this.state.selectResolution;
  },

  getOrientation: function () {
    return this.state.selectOrientation;
  },

  getFormat: function () {
    return this.state.selectFormat;
  },

  setFormat: function (e) {
    this.setState({
      selectFormat: e.target.value
    });
  },

  setResolution: function(e) {
    this.setState({
      selectResolution: e.target.value
    });
  },

  setScale: function(e) {
    this.setState({
      selectScale: e.target.value
    });
  },

  setOrientation: function(e) {
    this.setState({
      selectOrientation: e.target.value
    });
  },

  removePreview: function () {
    this.props.model.removePreview();
  },

  addPreview: function (map) {
    var scale  = this.getScale()
    ,   paper  = this.getPaperMeasures()
    ,   center = this.props.model.getPreviewFeature() ?
                 ol.extent.getCenter(this.props.model.getPreviewFeature().getGeometry().getExtent()) :
                 map.getView().getCenter();

    this.props.model.addPreview(scale, paper, center);
  },

  exportPDF: function () {
    this.setState({
      loading: true
    });
    var node = $(ReactDOM.findDOMNode(this)).find('#pdf')
    ,   options = {
          size: this.getPaperMeasures(),
          format: this.getFormat(),
          orientation: this.getOrientation(),
          format: this.getFormat(),
          scale: this.getScale(),
          resolution: this.getResolution()
        }
    ;
    node.html('');
    this.props.model.exportPDF(options, (anchor) => {
      this.setState({
        loading: false
      });
      node.html(`<a href="${anchor}" target="_blank">Hämta</a>`);
    });
  },

  componentWillUnmount: function () {
    this.removePreview();
  },

  render: function () {
    var map = this.props.olMap
    ,   scales = [1000, 2000, 5000, 10000, 20000, 50000, 100000, 250000]
    ,   resolutions = [72, 96, 150]
    ,   options
    ,   resolutionOptions
    ,   loader = null;

    if (this.state.loading) {
      loader = <i className="fa fa-refresh fa-spin"></i>;
    }

    if (!this.props.visible) return null;

    options = scales.map((s, i) => <option key={i} value={s}>1:{s}</option>);
    resolutionOptions = resolutions.map((s, i) => <option key={i} value={s}>{s}</option>);

    this.addPreview(map);

    return (
      <div className="export-settings">
        <div className="panel panel-default">
          <div className="panel-heading">Välj pappersstorlek</div>
          <div className="panel-body">
            <select onChange={this.setFormat} defaultValue={this.state.selectFormat}>
              <option value="A3">A3</option>
              <option value="A4">A4</option>
            </select>
          </div>
        </div>
        <div className="panel panel-default">
          <div className="panel-heading">Välj orientering</div>
          <div className="panel-body">
            <select onChange={this.setOrientation} defaultValue={this.state.selectOrientation}>
              <option value="P">stående</option>
              <option value="L">liggande</option>
            </select>
          </div>
        </div>
        <div className="panel panel-default">
          <div className="panel-heading">Välj skala</div>
          <div className="panel-body">
            <select onChange={this.setScale} defaultValue={this.state.selectScale}>
              {options}
            </select>
          </div>
        </div>
        <div className="panel panel-default">
          <div className="panel-heading">Välj upplösning</div>
          <div className="panel-body">
            <select onChange={this.setResolution} defaultValue={this.state.selectResolution}>
              {resolutionOptions}
            </select>
          </div>
        </div>
        <div>
          <button onClick={this.exportPDF} className="btn btn-default">Skriv ut {loader}</button>
        </div>
        <div id="pdf"></div>
      </div>
    )
  }
});

var ExportPanel = React.createClass({

  getInitialState: function() {
    return {
      showExportSettings: true
    };
  },

  setExportSettings: function (value) {
    this.setState({
      showExportSettings: value
    });
  },

  exportImage: function () {
    var node = $(ReactDOM.findDOMNode(this)).find('#image');
    node.html('');
    this.props.model.exportImage((anchor) => {
      node.html(anchor);
    });
  },

  render: function () {
    return (
      <Panel title="Skriv ut karta" onCloseClicked={this.props.onCloseClicked}>
        <div className="export-panel">
          <ExportSettings
            visible={this.state.showExportSettings}
            model={this.props.model}
            olMap={this.props.model.get('olMap')}
          />
        </div>
      </Panel>
    );
  }
});

module.exports = ExportPanel;