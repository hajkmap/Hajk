var Panel = require('views/panel');

var ExportSettings = React.createClass({

  getInitialState: function() {
    return {
      selectFormat: 'A4',
      selectOrientation: 'L'
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

    var dpi    = 72
    ,   width  = pageSize(this.getFormat()).width
    ,   height = pageSize(this.getFormat()).height;

    return {
      width: ((width / 25.4) * dpi),
      height:  ((height / 25.4) * dpi),
      x: this.exportPreviewFrame ? this.exportPreviewFrame.get(0).offsetLeft : 0,
      y: this.exportPreviewFrame ? this.exportPreviewFrame.get(0).offsetTop : 0
    };
  },

  setScale: function (map, scale) {

    var view  = map.getView()
    ,   units = map.getView().getProjection().getUnits()
    ,   dpi   = 25.4 / 0.28
    ,   mpu   = ol.proj.METERS_PER_UNIT[units];

    res = scale / (mpu * 39.37 * dpi);
    view.setResolution(res);
  },

  getScale: function (map) {

    var view  = map.getView()
    ,   res   = view.getResolution()
    ,   units = map.getView().getProjection().getUnits()
    ,   dpi   = 25.4 / 0.28
    ,   mpu   = ol.proj.METERS_PER_UNIT[units];

    return res * mpu * 39.37 * dpi;
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

  setOrientation: function(e) {
    this.setState({
      selectOrientation: e.target.value
    });
  },

  removePreview: function () {
    if (this.exportPreviewFrame) {
      this.exportPreviewFrame.remove();
    }
  },

  addPreview: function (map) {
    var size = this.getPaperMeasures();
    this.removePreview();
    this.exportPreviewFrame = $('<div></div>');
    this.exportPreviewFrame.css({
      top: '50%',
      left: '50%',
      marginTop: `-${size.height / 2}px`,
      marginLeft: `-${size.width / 2}px`,
      border: '1px solid',
      position: 'absolute',
      background: 'rgba(0,0,0,0.5)',
      width: size.width,
      height: size.height
    });
    $('.ol-viewport').append(this.exportPreviewFrame);
  },

  exportPDF: function () {
    var node = $(ReactDOM.findDOMNode(this)).find('#pdf')
    ,   options = {
          size: this.getPaperMeasures(),
          orientation: this.getOrientation(),
          format: this.getFormat()
        }
    ;
    node.html('');
    this.props.model.exportPDF(options, (anchor) => {
      node.html(anchor);
    });
  },

  componentWillUnmount: function () {
    this.removePreview();
  },

  render: function () {
    var setScale
    ,   guess
    ,   map = this.props.olMap
    ,   scales = [1000, 2000, 5000, 10000, 20000, 50000, 100000, 250000]
    ,   options
    ,   scale;

    if (!this.props.visible) return null;

    setScale = (value) => {
      var scale = 0;

      if (typeof value === 'object') {
        if (value.target) {
          scale = parseInt(value.target.value)
        }
      }

      if (typeof value === "number") {
        scale = value;
      }

      this.setScale(map, scale);
    };

    guess = () => {
      var goal = this.getScale(map);
      return scales.reduce((prev, curr) =>
        Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev
      );
    };

    setScale(guess());
    scale = this.getScale(map)
    options = scales.map((s, i) => <option key={i} value={s}>1:{s}</option>);
    this.addPreview(map);

    return (
      <div className="export-settings">
        <div>Välj pappersstorlek</div>
        <select onChange={this.setFormat} defaultValue={this.state.selectFormat}>
          <option value="A3">A3</option>
          <option value="A4">A4</option>
        </select>
        <div>Välj orientering</div>
          <select onChange={this.setOrientation} defaultValue={this.state.selectOrientation}>
            <option value="P">stående</option>
            <option value="L">liggande</option>
          </select>
        <div>Välj skala</div>
        <select onChange={setScale} defaultValue={scale}>
          {options}
        </select>
        <div>
          <button onClick={this.exportPDF} className="btn btn-default">Exportera</button>
        </div>
        <div id="pdf"></div>
      </div>
    )
  }

});

var ExportPanel = React.createClass({

  getInitialState: function() {
    return {
      showExportSettings: false
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
      <Panel title="Exportera karta" onCloseClicked={this.props.onCloseClicked}>
        <div className="export-panel">
          <div onClick={this.exportImage}>
            <button className="btn btn-default">Skapa export som bild</button>
            <div id="image"></div>
          </div>
          <br/>
          <div onClick={() => this.setExportSettings(true)}>
            <button className="btn btn-default">Skapa export som pdf</button>
          </div>
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