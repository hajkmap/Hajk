var Panel = require('views/panel');
var isMobile = () => document.body.clientWidth <= 600;

/**
 * @class
 */
var RoutingPanelView = {
  /**
   * Get initial state.
   * @instance
   * @return {object}
   */
  getInitialState: function() {
    return {
      selectTravelMode: "walk"
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
  },

  /**
   * Generete anchor text.
   * @instance
   */
  generate: function () {

  },

  getTravelMode: function () {
    return this.state.selectTravelMode;
  },

  setTravelMode: function(e) {
    this.setState({
      selectTravelMode: e.target.value
    });
  },

  activateStartMode: function(){
    if (isMobile()) {
      this.props.navigationPanel.minimize();
    }

    this.props.model.activateStartMode(); // working
  },
  activateEndMode: function(){
    if (isMobile()) {
      this.props.navigationPanel.minimize();
    }

    this.props.model.activateEndMode(); // working
  },

  showResult: function(routeResult) {
    console.log(this.props.model.plotRoute(res));
  },

  showImage: function(src, id) {
    var img = document.createElement("img");
    img.src = src;
    img.id = id;

    document.body.appendChild(img);
  },
  /**
   * Render the view
   * @instance
   * @return {external:ReactElement}
   */
  render: function () {
    this.props.model.initStartPoint();

    return(
      <Panel title="Navigation"  onCloseClicked={this.props.onCloseClicked} onUnmountClicked={this.props.onUnmountClicked} minimized={this.props.minimized}>
        <div className="panel-content">
          <p>
            ① Välj startpunkt genom att trycka på någon av knapparna under "Välj startpunkt". <br/>
            ② Välj mål genom att trycka på knappen "Välj position på kartan" och klicka sedan i kartan. <br/>
            ③ Välj färdsätt genom att trycka på någon av knapparna. <br/>
            ④ Tryck på "Sök resa". <br/>
          </p>
          <div className="panel panel-default">
              <div className="panel-heading"> ①. Välj startpunkt </div>
                <div className="panel-body">
                  <button onClick={() => this.props.model.turnOnGPSClicked()} className="btn btn-main" id="naviGPS">Välj befintlig position</button>&nbsp;
                  <button onClick={() => this.activateStartMode()} className="btn btn-main" id="startBtn">Välj position på kartan</button>
                </div>
          </div>
          <div className="panel panel-default">
             <div className="panel-heading"> ②. Välj destination </div>
               <div className="panel-body">
                 <button onClick={() => this.activateEndMode()} className="btn btn-main" id="startBtn">Välj position på kartan</button>
             </div>
          </div>
          <div className="panel panel-default">
             <div className="panel-heading"> ③. Välj färdsätt </div>
             <div className="panel-body">
               <button className="btn btn-default" onClick={() => this.props.model.setTravelMode('walking')}><img src="/assets/icons/gaRouting.png"/></button>
               <button className="btn btn-default" onClick={() => this.props.model.setTravelMode('driving')}><img src="/assets/icons/koraRouting.png"/></button>
               <button className="btn btn-default" onClick={() => this.props.model.setTravelMode('bicycling')}><img src="/assets/icons/cyklaRouting.png"/></button>
               <button className="btn btn-default" onClick={() => this.props.model.setTravelMode('transit')}><img src="/assets/icons/kollektivRouting.png"/></button>
             </div>
          </div>
          <div className="panel panel-default-transparent">
             <button onClick={() => this.props.model.activateRoutingMode()} className="btn btn-main" id="startBtn">Sök resa</button>&nbsp;
             <button onClick={() => this.props.model.deleteLayers()} className="btn btn-main" id="startBtn">Rensa</button>
          </div>
          <div className="panel panel-default">
             <div className="panel-heading"> Resultat </div>
                 <div className="panel-body">
                   <div id="resultList"></div>
                 </div>
          </div>
        </div>
      </Panel>
    );
  }
};

/**
 * RoutingPanelView module.<br>
 * Use <code>require('views/routingpanel')</code> for instantiation.
 * @module RoutingPanel-module
 * @returns {RoutingPanelView}
 */
module.exports = React.createClass(RoutingPanelView);
