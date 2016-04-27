var Panel = require('views/panel');

var CoordinatesList = React.createClass({

  isPlanar: function(epsgString) {
    return (
      ['WGS 84'].indexOf(epsgString) === -1
    );
  },

  convertDDToDMS: function(D, lng){
    return {
      dir : D<0?lng?'W':'S':lng?'E':'N',
      deg : Math.floor((D<0?D=-D:D)),
      min : Math.floor((D*60)%60),
    sec : ((D*3600)%60).toFixed(5)
    };
  },

  formatDMS: function(dms) {
    return (
      [dms.deg, '°', dms.min, '′', dms.sec, '″', dms.dir].join('')
    )
  },

  processSphericalXY: function(xyObject) {
    var that = this;
    return Object.keys(xyObject).map( function(key) {
      return (
        <dd>
          <strong>{ key.toUpperCase() }: </strong>
          {
            key === 'x' ?
            that.formatDMS(that.convertDDToDMS(xyObject[key], true)) :
            that.formatDMS(that.convertDDToDMS(xyObject[key], false))
          }
        </dd>
      )
    })
  },

  processPlanarXY: function(xyObject) {
    return Object.keys(xyObject).map( function(key) {
      return (
        <dd>
          <strong>{ key.toUpperCase() }: </strong>
          { xyObject[key].toFixed(2) } m
        </dd>
      )
    })
  },

  processTitle: function(title) {
    return (
      <dt> { title } </dt>
    )
  },

  processRow: function(object, title) {
    if (this.isPlanar(title)) {
      return (
        [this.processTitle(title), this.processPlanarXY(object)]
      )
    } else {
      return (
        [this.processTitle(title), this.processSphericalXY(object)]
      )
    }
  },

  render: function() {
    var coordinates = this.props.coordinates;
    var that = this;
    return (
      <dl>
        { Object.keys(coordinates).map( function(key) {
          return (
            that.processRow(coordinates[key], key)
          );
        })}
      </dl>
    )
  }
});

module.exports = React.createClass({

  getInitialState: function() {
    return {
      visible: false,
      interactionVisible: true
    };
  },

  componentWillMount: function () {
    this.setState({
      coordinates: this.props.model.presentCoordinates()
    });
  },

  componentWillUnmount: function () {
    this.props.model.off('change:position', this.writeCoordinates);
    this.props.model.removeInteractions();
  },

  componentDidMount: function () {
    this.props.model.on('change:position', this.writeCoordinates);
  },

  writeCoordinates: function () {
    this.setState({
      coordinates: this.props.model.presentCoordinates()
    });
  },

  reset: function () {
    this.setState({
      interactionVisible: !this.state.interactionVisible
    });
    this.state.interactionVisible ? this.props.model.removeInteractions() :
                                    this.props.model.createInteractions();
  },

  render: function () {
    var coordinates = this.state.coordinates.transformed;
    var buttonText  = this.state.interactionVisible ? "Dölj" : "Visa";
    return (
      <Panel title="Koordinater" onCloseClicked={this.props.onCloseClicked}>
        <div className="coordinate-display">
          <CoordinatesList coordinates={coordinates} />
        </div>
      </Panel>
    );
  }

});
